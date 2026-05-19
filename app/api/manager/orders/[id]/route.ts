import { NextResponse } from "next/server";

import { forbiddenResponse, requireManager, unauthorizedResponse } from "@/lib/auth";
import { withResolvedNestedFoodImages } from "@/lib/food-images";
import { prisma } from "@/lib/prisma";
import { createServerErrorResponse } from "@/lib/server-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const orderPartySelect = {
  createdAt: true,
  email: true,
  id: true,
  name: true,
  phone: true,
  role: true,
} as const;

const managerOrderInclude = {
  courier: {
    select: orderPartySelect,
  },
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
} as const;

function getOrderId(request: Request) {
  return new URL(request.url).pathname.split("/").at(-1)?.trim() ?? "";
}

export async function PATCH(request: Request) {
  try {
    await requireManager(request);
    const id = getOrderId(request);

    if (!id) {
      return NextResponse.json({ error: "Order id is required." }, { status: 400 });
    }

    const body = (await request.json()) as {
      action?: unknown;
    };

    const action = body.action === "start-cooking" || body.action === "send-to-courier"
      ? body.action
      : null;

    if (!action) {
      return NextResponse.json(
        { error: "Provide a valid manager action." },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: {
          id,
        },
        include: {
          payment: true,
          tracking: true,
        },
      });

      if (!currentOrder) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (currentOrder.status === "CANCELLED") {
        throw new Error("ORDER_CANCELLED");
      }

      if (currentOrder.status === "DELIVERED") {
        throw new Error("ORDER_DELIVERED");
      }

      if (currentOrder.status === "DELIVERING") {
        throw new Error("ORDER_ALREADY_WITH_COURIER");
      }

      if (
        currentOrder.payment
        && (currentOrder.payment.status === "FAILED" || currentOrder.payment.status === "REFUNDED")
      ) {
        throw new Error("ORDER_PAYMENT_INVALID");
      }

      if (action === "start-cooking") {
        if (currentOrder.status !== "PENDING") {
          throw new Error("ORDER_ALREADY_ACCEPTED");
        }

        await tx.order.update({
          where: {
            id,
          },
          data: {
            acceptedAt: new Date(),
            status: "COOKING",
          },
        });

        if (currentOrder.tracking) {
          await tx.tracking.update({
            where: {
              orderId: id,
            },
            data: {
              status: "PREPARING",
            },
          });
        } else {
          await tx.tracking.create({
            data: {
              orderId: id,
              status: "PREPARING",
            },
          });
        }
      }

      if (action === "send-to-courier") {
        if (currentOrder.status !== "COOKING") {
          throw new Error("ORDER_NOT_READY_FOR_COURIER");
        }

        await tx.order.update({
          where: {
            id,
          },
          data: {
            courierId: null,
            readyForCourierAt: new Date(),
            status: "CONFIRMED",
          },
        });

        if (currentOrder.tracking) {
          await tx.tracking.update({
            where: {
              orderId: id,
            },
            data: {
              status: "PREPARING",
            },
          });
        } else {
          await tx.tracking.create({
            data: {
              orderId: id,
              status: "PREPARING",
            },
          });
        }
      }

      return tx.order.findUnique({
        where: {
          id,
        },
        include: managerOrderInclude,
      });
    });

    if (!updatedOrder) {
      return NextResponse.json({ error: "Manager order not found." }, { status: 404 });
    }

    return NextResponse.json(withResolvedNestedFoodImages(updatedOrder));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") {
      return NextResponse.json({ error: "Manager order not found." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "ORDER_CANCELLED") {
      return NextResponse.json({ error: "This order has already been cancelled." }, { status: 409 });
    }

    if (error instanceof Error && error.message === "ORDER_DELIVERED") {
      return NextResponse.json({ error: "This order has already been delivered." }, { status: 409 });
    }

    if (error instanceof Error && error.message === "ORDER_ALREADY_ACCEPTED") {
      return NextResponse.json(
        { error: "This order has already moved out of the incoming queue." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "ORDER_NOT_READY_FOR_COURIER") {
      return NextResponse.json(
        { error: "Only cooking orders can be handed off to the courier queue." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "ORDER_ALREADY_WITH_COURIER") {
      return NextResponse.json(
        { error: "A courier has already claimed this order." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "ORDER_PAYMENT_INVALID") {
      return NextResponse.json(
        { error: "Orders with failed or refunded payments cannot move forward." },
        { status: 409 }
      );
    }

    return createServerErrorResponse(
      "api/manager/orders/[id].PATCH",
      "Unable to update the manager order right now.",
      error
    );
  }
}
