import { NextResponse } from "next/server";

import type { AdminDashboardData, AdminDashboardUser } from "@/features/admin/admin.types";
import { forbiddenResponse, requireAdmin, unauthorizedResponse } from "@/lib/auth";
import { resolveFoodImage } from "@/lib/food-images";
import { prisma } from "@/lib/prisma";
import { createServerErrorResponse } from "@/lib/server-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DashboardScope = "full" | "sales" | "users" | "couriers" | "managers";
type ManagedDashboardRole = "CUSTOMER" | "COURIER" | "MANAGER";

type TopFoodAccumulator = {
  category: string;
  foodId: string;
  image: string;
  isAvailable: boolean;
  name: string;
  totalRevenue: number;
  totalUnits: number;
};

const DEFAULT_DASHBOARD_STATS: AdminDashboardData["stats"] = {
  activeFoods: 0,
  openFeedback: 0,
  totalFeedback: 0,
  totalFoods: 0,
  totalOrders: 0,
  totalUnitsSold: 0,
};

const DASHBOARD_SCOPES = new Set<DashboardScope>([
  "full",
  "sales",
  "users",
  "couriers",
  "managers",
]);

function createEmptyDashboardData(): AdminDashboardData {
  return {
    feedbacks: [],
    stats: { ...DEFAULT_DASHBOARD_STATS },
    topFoods: [],
    users: [],
  };
}

function getDashboardScope(request: Request): DashboardScope {
  const scope = new URL(request.url).searchParams.get("scope");

  if (scope && DASHBOARD_SCOPES.has(scope as DashboardScope)) {
    return scope as DashboardScope;
  }

  return "full";
}

function mapDashboardUsers(
  users: Array<{
    createdAt: Date;
    email: string;
    id: string;
    name: string;
    phone: string | null;
    role: "ADMIN" | "CUSTOMER" | "MANAGER" | "COURIER";
    _count: {
      deliveries: number;
      feedbacks: number;
      orders: number;
    };
  }>
): AdminDashboardUser[] {
  return users
    .filter((user) => user.role !== "ADMIN")
    .map((user) => ({
      createdAt: user.createdAt.toISOString(),
      deliveryCount: user._count.deliveries,
      email: user.email,
      feedbackCount: user._count.feedbacks,
      id: user.id,
      name: user.name,
      orderCount: user._count.orders,
      phone: user.phone,
      role: user.role,
    }));
}

async function loadDashboardUsers(role?: ManagedDashboardRole) {
  const users = await prisma.user.findMany({
    where: role
      ? { role }
      : {
          role: {
            not: "ADMIN",
          },
        },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      createdAt: true,
      email: true,
      id: true,
      name: true,
      phone: true,
      role: true,
      _count: {
        select: {
          deliveries: true,
          feedbacks: true,
          orders: true,
        },
      },
    },
  });

  return mapDashboardUsers(users);
}

async function loadLatestFeedbacks() {
  return prisma.feedback.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      createdAt: true,
      email: true,
      id: true,
      message: true,
      name: true,
      resolvedAt: true,
      status: true,
      type: true,
      user: {
        select: {
          email: true,
          id: true,
          name: true,
          role: true,
        },
      },
      userId: true,
    },
    take: 20,
  });
}

async function loadSalesSnapshot() {
  const soldItemGroups = await prisma.orderItem.groupBy({
    by: ["foodCategory", "foodId", "foodImage", "foodName", "price"],
    where: {
      order: {
        status: {
          not: "CANCELLED",
        },
      },
    },
    _sum: {
      quantity: true,
    },
  });

  if (soldItemGroups.length === 0) {
    return {
      topFoods: [] as AdminDashboardData["topFoods"],
      totalUnitsSold: 0,
    };
  }

  const persistedFoodIds = Array.from(new Set(
    soldItemGroups.flatMap((item) => (item.foodId ? [item.foodId] : []))
  ));
  const foodAvailability = persistedFoodIds.length
    ? await prisma.food.findMany({
        where: {
          id: {
            in: persistedFoodIds,
          },
        },
        select: {
          id: true,
          isAvailable: true,
        },
      })
    : [];

  const availabilityByFoodId = new Map(
    foodAvailability.map((food) => [food.id, food.isAvailable])
  );
  const topFoodMap = soldItemGroups.reduce<Map<string, TopFoodAccumulator>>((map, item) => {
    const quantity = item._sum.quantity ?? 0;

    if (quantity <= 0) {
      return map;
    }

    const mapKey = item.foodId ?? `${item.foodName}:${item.foodCategory}`;
    const current = map.get(mapKey);

    if (current) {
      current.totalRevenue += item.price * quantity;
      current.totalUnits += quantity;
      return map;
    }

    map.set(mapKey, {
      category: item.foodCategory,
      foodId: item.foodId ?? mapKey,
      image: resolveFoodImage(item.foodImage),
      isAvailable: item.foodId ? availabilityByFoodId.get(item.foodId) ?? false : false,
      name: item.foodName,
      totalRevenue: item.price * quantity,
      totalUnits: quantity,
    });

    return map;
  }, new Map());

  const topFoods = Array.from(topFoodMap.values())
    .sort((left, right) => (
      right.totalUnits - left.totalUnits
      || right.totalRevenue - left.totalRevenue
      || left.name.localeCompare(right.name)
    ))
    .slice(0, 5);

  const totalUnitsSold = soldItemGroups.reduce(
    (sum, item) => sum + (item._sum.quantity ?? 0),
    0
  );

  return {
    topFoods,
    totalUnitsSold,
  };
}

async function loadDashboardStats() {
  const [foodAvailabilityGroups, feedbackStatusGroups, totalOrders, salesSnapshot] = await Promise.all([
    prisma.food.groupBy({
      by: ["isAvailable"],
      _count: {
        _all: true,
      },
    }),
    prisma.feedback.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),
    prisma.order.count({
      where: {
        status: {
          not: "CANCELLED",
        },
      },
    }),
    loadSalesSnapshot(),
  ]);

  const totalFoods = foodAvailabilityGroups.reduce(
    (sum, group) => sum + group._count._all,
    0
  );
  const activeFoods =
    foodAvailabilityGroups.find((group) => group.isAvailable)?._count._all ?? 0;
  const totalFeedback = feedbackStatusGroups.reduce(
    (sum, group) => sum + group._count._all,
    0
  );
  const openFeedback =
    feedbackStatusGroups.find((group) => group.status === "OPEN")?._count._all ?? 0;

  return {
    stats: {
      activeFoods,
      openFeedback,
      totalFeedback,
      totalFoods,
      totalOrders,
      totalUnitsSold: salesSnapshot.totalUnitsSold,
    },
    topFoods: salesSnapshot.topFoods,
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const scope = getDashboardScope(request);

    if (scope === "sales") {
      const salesSnapshot = await loadSalesSnapshot();
      return NextResponse.json({
        ...createEmptyDashboardData(),
        stats: {
          ...DEFAULT_DASHBOARD_STATS,
          totalUnitsSold: salesSnapshot.totalUnitsSold,
        },
        topFoods: salesSnapshot.topFoods,
      });
    }

    if (scope === "users") {
      const [users, feedbacks] = await Promise.all([
        loadDashboardUsers("CUSTOMER"),
        loadLatestFeedbacks(),
      ]);

      return NextResponse.json({
        ...createEmptyDashboardData(),
        feedbacks,
        users,
      });
    }

    if (scope === "couriers") {
      const users = await loadDashboardUsers("COURIER");

      return NextResponse.json({
        ...createEmptyDashboardData(),
        users,
      });
    }

    if (scope === "managers") {
      const users = await loadDashboardUsers("MANAGER");

      return NextResponse.json({
        ...createEmptyDashboardData(),
        users,
      });
    }

    const [{ stats, topFoods }, feedbacks, users] = await Promise.all([
      loadDashboardStats(),
      loadLatestFeedbacks(),
      loadDashboardUsers(),
    ]);

    return NextResponse.json({
      feedbacks,
      stats,
      topFoods,
      users,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }

    return createServerErrorResponse(
      "api/admin/dashboard",
      "Unable to load the admin dashboard right now.",
      error
    );
  }
}
