import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma";
import type { OrderStatus } from "@/generated/prisma/client";
import { requireCourier, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { sanitizeCourierAvailableOrder } from "@/lib/courier-order-security";
import { getPublicDeliveryVerification } from "@/lib/delivery-verification";
import { withResolvedNestedFoodImagesList } from "@/lib/food-images";
import { prisma } from "@/lib/prisma";
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

function serializeCourierOrders(orders: CourierOrderRecord[]) {
  return withResolvedNestedFoodImagesList(
    orders.map((order) => ({
      ...order,
      deliveryVerification: getPublicDeliveryVerification(
        order.deliveryVerification ?? null
      ),
    }))
  );
}

export async function GET(request: Request) {
  try {
    const { user } = await requireCourier(request);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [activeOrders, availableOrders, completedToday] = await Promise.all([
      prisma.order.findMany({
        where: {
          courierId: user.id,
          status: {
            in: ACTIVE_ORDER_STATUSES,
          },
        },
        include: courierOrderInclude,
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.order.findMany({
        where: {
          courierId: null,
          status: "CONFIRMED",
        },
        include: courierOrderInclude,
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.order.count({
        where: {
          courierId: user.id,
          status: "DELIVERED",
          tracking: {
            is: {
              updatedAt: {
                gte: startOfDay,
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      activeOrders: serializeCourierOrders(activeOrders),
      availableOrders: serializeCourierOrders(availableOrders).map((order) =>
        sanitizeCourierAvailableOrder(order)
      ),
      completedToday,
      courier: user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    return createServerErrorResponse(
      "api/courier/orders.GET",
      "Unable to load courier orders right now.",
      error
    );
  }
}
