import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma";
import type { OrderStatus } from "@/generated/prisma/client";
import { forbiddenResponse, requireCourier, unauthorizedResponse } from "@/lib/auth";
import { sanitizeCourierAvailableOrder } from "@/lib/courier-order-security";
import {
  getPublicDeliveryVerification,
} from "@/lib/delivery-verification";
import { withResolvedNestedFoodImages } from "@/lib/food-images";
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_ORDER_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "COOKING", "DELIVERING"];

const orderPartySelect = {
  createdAt: true,
  email: true,
  id: true,
  name: true,
  phone: true,
  role: true,
} as const;

const deliveryVerificationSelect = {
  channel: true,
  expiresAt: true,
  lastSentAt: true,
  recipientEmail: true,
  recipientPhone: true,
  verifiedAt: true,
} as const;

const courierOrderInclude = {
  courier: {
    select: orderPartySelect,
  },
  deliveryVerification: {
    select: deliveryVerificationSelect,
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

type CourierOrderRecord = Prisma.OrderGetPayload<{
  include: typeof courierOrderInclude;
}>;

function getOrderId(request: Request) {
  return new URL(request.url).pathname.split("/").at(-1)?.trim() ?? "";
}

function parseCoordinate(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function serializeCourierOrder(order: CourierOrderRecord) {
  return withResolvedNestedFoodImages({
    ...order,
    deliveryVerification: getPublicDeliveryVerification(
      order.deliveryVerification ?? null
    ),
  });
}

export async function GET(request: Request) {
  try {
    const { user } = await requireCourier(request);
    const id = getOrderId(request);

    if (!id) {
      return NextResponse.json({ error: "Order id is required." }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        OR: [
          { courierId: null },
          { courierId: user.id },
        ],
      },
      include: courierOrderInclude,
    });

    if (!order) {
      return NextResponse.json({ error: "Courier order not found." }, { status: 404 });
    }

    const resolvedOrder = serializeCourierOrder(order);

    return NextResponse.json(
      order.courierId === null
        ? sanitizeCourierAvailableOrder(resolvedOrder)
        : resolvedOrder
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    return createServerErrorResponse(
      "api/courier/orders/[id].GET",
      "Unable to load the courier order right now.",
      error
    );
  }
}

export async function PATCH(request: Request) {
  try {
    assertTrustedOrigin(request);
    const { user } = await requireCourier(request);
    const id = getOrderId(request);
    const rateLimit = checkRateLimit({
      identifier: `${user.id}:${getClientIdentifier(request)}`,
      key: "courier-order-write",
      limit: 240,
      windowMs: 1000 * 60 * 10,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        "Too many courier updates. Please wait a moment and try again."
      );
    }

    if (!id) {
      return NextResponse.json({ error: "Order id is required." }, { status: 400 });
    }

    const body = (await request.json()) as {
      action?: unknown;
      latitude?: unknown;
      longitude?: unknown;
    };

    const action =
      body.action === "claim" ||
      body.action === "complete"
        ? body.action
        : null;
    const latitude = parseCoordinate(body.latitude);
    const longitude = parseCoordinate(body.longitude);

    if (!action && latitude === null && longitude === null) {
      return NextResponse.json(
        { error: "Provide an action or live location coordinates." },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: {
          id,
        },
        include: {
          deliveryVerification: true,
          payment: true,
          tracking: true,
          user: {
            select: orderPartySelect,
          },
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

      if (action === "claim") {
        const existingActiveDelivery = await tx.order.findFirst({
          where: {
            courierId: user.id,
            status: {
              in: ACTIVE_ORDER_STATUSES,
            },
            NOT: {
              id,
            },
          },
          select: {
            id: true,
          },
        });

        if (existingActiveDelivery) {
          throw new Error("COURIER_ALREADY_ASSIGNED");
        }

        if (currentOrder.courierId && currentOrder.courierId !== user.id) {
          throw new Error("ORDER_ALREADY_CLAIMED");
        }

        if (currentOrder.status !== "CONFIRMED") {
          throw new Error("ORDER_NOT_READY");
        }

        await tx.order.update({
          where: {
            id,
          },
          data: {
            courierId: user.id,
            status: "DELIVERING",
          },
        });

        if (currentOrder.tracking) {
          await tx.tracking.update({
            where: {
              orderId: id,
            },
            data: {
              status: "ON_THE_WAY",
              latitude: latitude ?? currentOrder.tracking.latitude,
              longitude: longitude ?? currentOrder.tracking.longitude,
            },
          });
        } else {
          await tx.tracking.create({
            data: {
              orderId: id,
              status: "ON_THE_WAY",
              latitude,
              longitude,
            },
          });
        }
      } else if (action === "complete") {
        if (currentOrder.courierId !== user.id) {
          throw new Error("COURIER_MISMATCH");
        }

        if (currentOrder.status !== "DELIVERING") {
          throw new Error("ORDER_NOT_ACTIVE_DELIVERY");
        }

        const deliveredAt = new Date();
        await tx.order.update({
          where: {
            id,
          },
          data: {
            deliveredAt,
            status: "DELIVERED",
          },
        });

        if (
          currentOrder.payment
          && currentOrder.payment.method === "CASH"
          && currentOrder.payment.status === "PENDING"
        ) {
          await tx.payment.update({
            where: {
              orderId: id,
            },
            data: {
              failureReason: null,
              paidAt: deliveredAt,
              status: "PAID",
            },
          });
        }

        if (currentOrder.tracking) {
          await tx.tracking.update({
            where: {
              orderId: id,
            },
            data: {
              status: "DELIVERED",
              latitude: latitude ?? currentOrder.tracking.latitude,
              longitude: longitude ?? currentOrder.tracking.longitude,
            },
          });
        } else {
          await tx.tracking.create({
            data: {
              orderId: id,
              status: "DELIVERED",
              latitude,
              longitude,
            },
          });
        }

        if (currentOrder.deliveryVerification) {
          await tx.deliveryVerification.update({
            where: {
              orderId: id,
            },
            data: {
              verifiedAt: deliveredAt,
            },
          });
        }
      } else {
        if (currentOrder.courierId !== user.id) {
          throw new Error("COURIER_MISMATCH");
        }

        if (currentOrder.tracking) {
          await tx.tracking.update({
            where: {
              orderId: id,
            },
            data: {
              status:
                currentOrder.tracking.status === "DELIVERED"
                  ? "DELIVERED"
                  : "ON_THE_WAY",
              latitude: latitude ?? currentOrder.tracking.latitude,
              longitude: longitude ?? currentOrder.tracking.longitude,
            },
          });
        } else {
          await tx.tracking.create({
            data: {
              orderId: id,
              status: "ON_THE_WAY",
              latitude,
              longitude,
            },
          });
        }
      }

      return tx.order.findUnique({
        where: {
          id,
        },
        include: courierOrderInclude,
      });
    });

    if (!updatedOrder) {
      return NextResponse.json({ error: "Courier order not found." }, { status: 404 });
    }

    return NextResponse.json(serializeCourierOrder(updatedOrder));
  } catch (error) {
    if (isTrustedOriginError(error)) {
      return untrustedOriginResponse();
    }

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") {
      return NextResponse.json({ error: "Courier order not found." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "ORDER_CANCELLED") {
      return NextResponse.json({ error: "This order has already been cancelled." }, { status: 409 });
    }

    if (error instanceof Error && error.message === "ORDER_DELIVERED") {
      return NextResponse.json({ error: "This order has already been delivered." }, { status: 409 });
    }

    if (error instanceof Error && error.message === "COURIER_ALREADY_ASSIGNED") {
      return NextResponse.json(
        { error: "Finish your current delivery before claiming another order." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "ORDER_ALREADY_CLAIMED") {
      return NextResponse.json(
        { error: "Another courier has already claimed this order." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "ORDER_NOT_READY") {
      return NextResponse.json(
        { error: "This order has not been released to the courier queue yet." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "COURIER_MISMATCH") {
      return NextResponse.json(
        { error: "This delivery belongs to a different courier." },
        { status: 403 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "ORDER_NOT_ACTIVE_DELIVERY"
    ) {
      return NextResponse.json(
        { error: "Only active courier deliveries can be completed." },
        { status: 409 }
      );
    }

    return createServerErrorResponse(
      "api/courier/orders/[id].PATCH",
      "Unable to update the courier order right now.",
      error
    );
  }
}
