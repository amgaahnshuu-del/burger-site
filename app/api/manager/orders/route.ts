import { NextResponse } from "next/server";

import { forbiddenResponse, requireManager, unauthorizedResponse } from "@/lib/auth";
import { withResolvedNestedFoodImagesList } from "@/lib/food-images";
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

export async function GET(request: Request) {
  try {
    const { user } = await requireManager(request);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [incomingOrders, preparingOrders, readyOrders, deliveringOrders, deliveredToday] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: "PENDING",
        },
        include: managerOrderInclude,
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.order.findMany({
        where: {
          status: "COOKING",
        },
        include: managerOrderInclude,
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.order.findMany({
        where: {
          courierId: null,
          status: "CONFIRMED",
        },
        include: managerOrderInclude,
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.order.findMany({
        where: {
          status: "DELIVERING",
        },
        include: managerOrderInclude,
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.order.count({
        where: {
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
      deliveredToday,
      deliveringOrders: withResolvedNestedFoodImagesList(deliveringOrders),
      incomingOrders: withResolvedNestedFoodImagesList(incomingOrders),
      manager: user,
      preparingOrders: withResolvedNestedFoodImagesList(preparingOrders),
      readyOrders: withResolvedNestedFoodImagesList(readyOrders),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    return createServerErrorResponse(
      "api/manager/orders.GET",
      "Unable to load manager orders right now.",
      error
    );
  }
}
