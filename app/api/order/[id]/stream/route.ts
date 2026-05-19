import { NextResponse } from "next/server";

import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { withResolvedNestedFoodImages } from "@/lib/food-images";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STREAM_INTERVAL_MS = 2000;
const KEEP_ALIVE_INTERVAL_MS = 15000;

const orderPartySelect = {
  createdAt: true,
  email: true,
  id: true,
  name: true,
  phone: true,
  role: true,
} as const;

function getOrderId(request: Request) {
  const segments = new URL(request.url).pathname.split("/");
  return segments.at(-2)?.trim() ?? "";
}

function createSseChunk(event: string, data: string) {
  return `event: ${event}\ndata: ${data}\n\n`;
}

async function loadOrderForUser(orderId: string, userId: string) {

  return prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      items: {
        include: {
          food: {
            include: {
              restaurant: true,
            },
          },
        },
      },
      payment: true,
      tracking: true,
      user: {
        select: orderPartySelect,
      },
      courier: {
        select: orderPartySelect,
      },
    },
  });
}

export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    const orderId = getOrderId(request);

    if (!orderId) {
      return NextResponse.json(
        { error: "Order id is required." },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();
    let lastPayload = "";
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let keepAliveId: ReturnType<typeof setInterval> | undefined;
    let closed = false;

    const cleanup = () => {
      if (closed) {
        return;
      }

      closed = true;

      if (intervalId) {
        clearInterval(intervalId);
      }

      if (keepAliveId) {
        clearInterval(keepAliveId);
      }
    };

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const sendOrder = async () => {
          if (closed) {
            return;
          }

          const order = await loadOrderForUser(orderId, user.id);

          if (!order) {
            controller.enqueue(
              encoder.encode(
                createSseChunk(
                  "error",
                  JSON.stringify({ message: "Order not found." })
                )
              )
            );
            cleanup();
            controller.close();
            return;
          }

          const payload = JSON.stringify(withResolvedNestedFoodImages(order));

          if (payload !== lastPayload) {
            lastPayload = payload;
            controller.enqueue(encoder.encode(createSseChunk("order", payload)));
          }
        };

        const handleAbort = () => {
          cleanup();

          try {
            controller.close();
          } catch {
            return;
          }
        };

        request.signal.addEventListener("abort", handleAbort, { once: true });

        try {
          await sendOrder();
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              createSseChunk(
                "error",
                JSON.stringify({
                  message:
                    process.env.NODE_ENV === "development" && error instanceof Error
                      ? error.message
                      : "Unable to start the live order stream.",
                })
              )
            )
          );
          cleanup();
          controller.close();
          return;
        }

        intervalId = setInterval(() => {
          void sendOrder().catch((error) => {
            if (closed) {
              return;
            }

            controller.enqueue(
              encoder.encode(
                createSseChunk(
                  "error",
                  JSON.stringify({
                    message:
                      process.env.NODE_ENV === "development" && error instanceof Error
                        ? error.message
                        : "Live order updates disconnected.",
                  })
                )
              )
            );
            cleanup();

            try {
              controller.close();
            } catch {
              return;
            }
          });
        }, STREAM_INTERVAL_MS);

        keepAliveId = setInterval(() => {
          if (closed) {
            return;
          }

          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        }, KEEP_ALIVE_INTERVAL_MS);
      },
      cancel() {
        cleanup();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json(
      { error: "Unable to open the live order stream right now." },
      { status: 500 }
    );
  }
}
