import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { withResolvedNestedFoodImages } from "@/lib/food-images";
import { getCustomerCancellationMessage } from "@/lib/order-lifecycle";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  createRateLimitResponse,
  getClientIdentifier,
} from "@/lib/rate-limit";
import {
  assertTrustedOrigin,
  isTrustedOriginError,
  untrustedOriginResponse,
} from "@/lib/request-security";
import { createServerErrorResponse } from "@/lib/server-error";
import { NextResponse } from "next/server";

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

function getOrderId(request: Request) {
  return new URL(request.url).pathname.split("/").at(-1)?.trim() ?? "";
}

export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    const id = getOrderId(request);

    if (!id) {
      return NextResponse.json(
        { error: "Order id is required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: user.id,
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

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(withResolvedNestedFoodImages(order));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return createServerErrorResponse(
      "api/order/[id].GET",
      "Unable to fetch the order right now.",
      error
    );
  }
}

export async function PATCH(request: Request) {
  try {
    assertTrustedOrigin(request);
    const { user } = await requireAuth(request);
    const id = getOrderId(request);
    const rateLimit = checkRateLimit({
      identifier: `${user.id}:${getClientIdentifier(request)}`,
      key: "order-update",
      limit: 20,
      windowMs: 1000 * 60 * 10,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        "Too many order updates. Please wait a little and try again."
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Order id is required." },
        { status: 400 }
      );
    }

    const body = (await request.json()) as {
      action?: unknown;
      reason?: unknown;
    };

    if (body.action !== "cancel") {
      return NextResponse.json(
        { error: "Provide a valid order action." },
        { status: 400 }
      );
    }

    const reason =
      typeof body.reason === "string" && body.reason.trim()
        ? body.reason.trim()
        : null;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findFirst({
        where: {
          id,
          userId: user.id,
        },
        include: {
          payment: true,
          tracking: true,
        },
      });

      if (!currentOrder) {
        throw new Error("ORDER_NOT_FOUND");
      }

      const cancellationMessage = getCustomerCancellationMessage(
        currentOrder.status,
        currentOrder.payment?.status ?? "PENDING"
      );

      if (cancellationMessage) {
        throw new Error(cancellationMessage);
      }

      const cancelledAt = new Date();

      await tx.order.update({
        where: {
          id,
        },
        data: {
          cancelReason: reason,
          cancelledAt,
          courierId: null,
          status: "CANCELLED",
        },
      });

      if (currentOrder.payment) {
        if (currentOrder.payment.status === "PAID") {
          await tx.payment.update({
            where: {
              orderId: id,
            },
            data: {
              failureReason: reason ?? "Customer cancelled before dispatch.",
              refundedAt: cancelledAt,
              status: "REFUNDED",
            },
          });
        } else if (currentOrder.payment.status === "PENDING") {
          await tx.payment.update({
            where: {
              orderId: id,
            },
            data: {
              failedAt: cancelledAt,
              failureReason: reason ?? "Customer cancelled before payment completed.",
              status: "FAILED",
            },
          });
        }
      }

      return tx.order.findFirst({
        where: {
          id,
          userId: user.id,
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
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(withResolvedNestedFoodImages(updatedOrder));
  } catch (error) {
    if (isTrustedOriginError(error)) {
      return untrustedOriginResponse();
    }

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message.trim()) {
      const knownCancellationErrors = [
        "Delivered orders cannot be cancelled.",
        "This order has already been cancelled.",
        "This order is already with a courier and can no longer be cancelled online.",
      ];

      if (knownCancellationErrors.includes(error.message)) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return createServerErrorResponse(
      "api/order/[id].PATCH",
      "Unable to update the order right now.",
      error
    );
  }
}
