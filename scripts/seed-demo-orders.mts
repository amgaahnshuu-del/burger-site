import "dotenv/config";

import { scryptSync } from "node:crypto";

import type { Prisma } from "../generated/prisma/client";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  TrackingStatus,
} from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";

const TARGET_ORDERS = 99;

const DISTRICTS = [
  { district: "Sukhbaatar", khoroo: "1-r khoroo", lat: 47.9189, lng: 106.9176 },
  { district: "Chingeltei", khoroo: "3-r khoroo", lat: 47.9244, lng: 106.9057 },
  { district: "Bayanzurkh", khoroo: "26-r khoroo", lat: 47.9215, lng: 106.9342 },
  { district: "Khan-Uul", khoroo: "15-r khoroo", lat: 47.8924, lng: 106.9152 },
  { district: "Bayangol", khoroo: "12-r khoroo", lat: 47.9153, lng: 106.8747 },
  { district: "Songinokhairkhan", khoroo: "18-r khoroo", lat: 47.9132, lng: 106.8224 },
] as const;

const CUSTOMERS = Array.from({ length: 12 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");

  return {
    id: `user-seed-customer-${number}`,
    email: `customer${number}@burger.mn`,
    name: `Seed Customer ${number}`,
    password: "Customer123456",
    phone: `+976 9900 ${String(1100 + index).slice(-4)}`,
    salt: `seed-customer-${number}`,
  };
});

const STAFF_USERS = [
  {
    id: "user-seed-admin",
    email: "admin@burger.mn",
    name: "Burger Admin",
    password: "Admin123456",
    phone: null,
    role: "ADMIN",
    salt: "seed-admin",
  },
  {
    id: "user-seed-manager",
    email: "manager@burger.mn",
    name: "Kitchen Manager",
    password: "Manager123456",
    phone: "+976 9911 3344",
    role: "MANAGER",
    salt: "seed-manager",
  },
  {
    id: "user-seed-courier",
    email: "courier@burger.mn",
    name: "Night Courier",
    password: "Courier123456",
    phone: "+976 9911 2233",
    role: "COURIER",
    salt: "seed-courier",
  },
] as const;

const STATUSES = [
  ...Array.from({ length: 20 }, () => "PENDING"),
  ...Array.from({ length: 20 }, () => "CONFIRMED"),
  ...Array.from({ length: 15 }, () => "COOKING"),
  ...Array.from({ length: 15 }, () => "DELIVERING"),
  ...Array.from({ length: 24 }, () => "DELIVERED"),
  ...Array.from({ length: 5 }, () => "CANCELLED"),
] as const;

type AvailableFood = {
  category: string;
  id: string;
  image: string;
  name: string;
  price: number;
};

function hashPassword(password: string, salt: string) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function shiftDate(base: Date, minutes: number) {
  return new Date(base.getTime() + minutes * 60_000);
}

function getOrderStatus(index: number): OrderStatus {
  return STATUSES[index - 1] as OrderStatus;
}

function getPaymentMethod(index: number): PaymentMethod {
  const methods = ["QPAY", "CARD", "CASH"] as const;
  return methods[(index - 1) % methods.length];
}

function getPaymentStatus(
  status: OrderStatus,
  method: PaymentMethod,
  index: number
): PaymentStatus {
  if (status === "CANCELLED") {
    return (index % 2 === 0 ? "FAILED" : "REFUNDED") as PaymentStatus;
  }

  if (status === "DELIVERED") {
    return "PAID" as PaymentStatus;
  }

  if (status === "DELIVERING") {
    return (method === "CASH" ? "PENDING" : "PAID") as PaymentStatus;
  }

  if (status === "CONFIRMED" || status === "COOKING") {
    return (method === "CASH" && index % 4 === 0 ? "PENDING" : "PAID") as PaymentStatus;
  }

  return "PENDING" as PaymentStatus;
}

function getTrackingStatus(status: OrderStatus): TrackingStatus | null {
  if (status === "DELIVERED") {
    return "DELIVERED" as TrackingStatus;
  }

  if (status === "DELIVERING") {
    return "ON_THE_WAY" as TrackingStatus;
  }

  if (status === "PENDING" || status === "CONFIRMED" || status === "COOKING") {
    return "PREPARING" as TrackingStatus;
  }

  return null;
}

function getFoodItems(index: number, foods: AvailableFood[]) {
  const itemCount = (index % 3) + 1;
  const items: Array<{
    foodCategory: string;
    foodId: string;
    foodImage: string;
    foodName: string;
    price: number;
    quantity: number;
  }> = [];
  const used = new Set<number>();

  for (let offset = 0; offset < itemCount; offset += 1) {
    let cursor = (index * 2 + offset * 5) % foods.length;

    while (used.has(cursor)) {
      cursor = (cursor + 1) % foods.length;
    }

    used.add(cursor);

    const food = foods[cursor];
    const quantity = ((index + offset) % 2) + 1;

    items.push({
      foodCategory: food.category,
      foodId: food.id,
      foodImage: food.image,
      foodName: food.name,
      price: food.price,
      quantity,
    });
  }

  return items;
}

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL_OVERRIDE?.trim() || process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  try {
    await prisma.$connect();

    const availableFoods = await prisma.food.findMany({
      where: {
        isAvailable: true,
      },
      orderBy: [
        {
          createdAt: "asc",
        },
        {
          id: "asc",
        },
      ],
      select: {
        category: true,
        id: true,
        image: true,
        name: true,
        price: true,
      },
    });

    if (availableFoods.length < 3) {
      throw new Error("At least 3 available foods are required before seeding demo orders.");
    }

    const summary = await prisma.$transaction(async (tx) => {
      await tx.tracking.deleteMany({
        where: {
          id: {
            startsWith: "tracking-seed-",
          },
        },
      });

      await tx.payment.deleteMany({
        where: {
          id: {
            startsWith: "payment-seed-",
          },
        },
      });

      await tx.orderItem.deleteMany({
        where: {
          id: {
            startsWith: "order-item-seed-",
          },
        },
      });

      await tx.order.deleteMany({
        where: {
          id: {
            startsWith: "order-seed-",
          },
        },
      });

      const staffUserIds = new Map<string, string>();
      const customerUserIds = new Map<string, string>();

      for (const user of STAFF_USERS) {
        const savedUser = await tx.user.upsert({
          where: {
            email: user.email,
          },
          create: {
            id: user.id,
            email: user.email,
            name: user.name,
            password: hashPassword(user.password, user.salt),
            phone: user.phone,
            role: user.role,
          },
          update: {
            name: user.name,
            password: hashPassword(user.password, user.salt),
            phone: user.phone,
            role: user.role,
          },
        });

        staffUserIds.set(user.email, savedUser.id);
      }

      for (const customer of CUSTOMERS) {
        const savedUser = await tx.user.upsert({
          where: {
            email: customer.email,
          },
          create: {
            id: customer.id,
            email: customer.email,
            name: customer.name,
            password: hashPassword(customer.password, customer.salt),
            phone: customer.phone,
            role: "CUSTOMER",
          },
          update: {
            name: customer.name,
            password: hashPassword(customer.password, customer.salt),
            phone: customer.phone,
            role: "CUSTOMER",
          },
        });

        customerUserIds.set(customer.email, savedUser.id);
      }

      for (const [index, customer] of CUSTOMERS.entries()) {
        const preferredPaymentMethods = ["QPAY", "CARD", "CASH"] as const;
        const preferredPaymentMethod =
          preferredPaymentMethods[index % preferredPaymentMethods.length];
        const customerUserId = customerUserIds.get(customer.email);

        if (!customerUserId) {
          throw new Error(`Unable to resolve seeded customer user id for ${customer.email}.`);
        }

        await tx.userSettings.upsert({
          where: {
            userId: customerUserId,
          },
          create: {
            id: `user-settings-${String(index + 1).padStart(2, "0")}`,
            userId: customerUserId,
            notificationsEnabled: true,
            preferredPaymentMethod,
          },
          update: {
            notificationsEnabled: true,
            preferredPaymentMethod,
          },
        });
      }

      const orders: Prisma.OrderCreateManyInput[] = [];
      const orderItems: Prisma.OrderItemCreateManyInput[] = [];
      const payments: Prisma.PaymentCreateManyInput[] = [];
      const trackings: Prisma.TrackingCreateManyInput[] = [];

      for (let index = 1; index <= TARGET_ORDERS; index += 1) {
        const orderNumber = String(index).padStart(3, "0");
        const customer = CUSTOMERS[(index - 1) % CUSTOMERS.length];
        const district = DISTRICTS[(index - 1) % DISTRICTS.length];
        const status = getOrderStatus(index);
        const method = getPaymentMethod(index);
        const paymentStatus = getPaymentStatus(status, method, index);
        const trackingStatus = getTrackingStatus(status);
        const items = getFoodItems(index, availableFoods);
        const totalPrice = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const createdAt = new Date(Date.UTC(2026, 4, 1, 8, 0, 0));

        createdAt.setUTCDate(createdAt.getUTCDate() + ((index - 1) % 11));
        createdAt.setUTCMinutes(createdAt.getUTCMinutes() + index * 19);

        const acceptedAt =
          status === "PENDING" || status === "CANCELLED"
            ? null
            : shiftDate(createdAt, 8 + (index % 6));
        const readyForCourierAt =
          status === "DELIVERING" || status === "DELIVERED"
            ? shiftDate(createdAt, 24 + (index % 8))
            : null;
        const deliveredAt =
          status === "DELIVERED"
            ? shiftDate(createdAt, 55 + (index % 10))
            : null;
        const cancelledAt =
          status === "CANCELLED"
            ? shiftDate(createdAt, 17 + (index % 9))
            : null;
        const paidAt =
          paymentStatus === "PAID"
            ? shiftDate(createdAt, status === "DELIVERED" ? 48 : 12)
            : null;
        const failedAt = paymentStatus === "FAILED" ? shiftDate(createdAt, 14) : null;
        const refundedAt =
          paymentStatus === "REFUNDED" ? shiftDate(createdAt, 22) : null;
        const courierId =
          status === "DELIVERING" || status === "DELIVERED"
            ? staffUserIds.get("courier@burger.mn") ?? null
            : null;
        const customerUserId = customerUserIds.get(customer.email);

        if (!customerUserId) {
          throw new Error(`Unable to resolve order customer user id for ${customer.email}.`);
        }
        const latitudeBase = district.lat + ((index % 5) * 0.0013);
        const longitudeBase = district.lng + ((index % 7) * 0.0011);
        const address = `${district.district} district, ${district.khoroo}, Peace Avenue ${20 + index}`;
        const addressLabel = index % 4 === 0 ? "Office" : "Home";
        const addressUnit = `${(index % 9) + 1}-${(index % 14) + 10}`;
        const addressNotes =
          index % 5 === 0
            ? "Ring the bell once and leave at the glass door."
            : "Please call on arrival.";
        const providerReference =
          method === "CASH" ? null : `BGR-${method}-SEED-${orderNumber}`;
        const providerPayload =
          method === "CASH"
            ? undefined
            : {
                imageQuality: "high",
                method,
                orderNumber,
                seed: true,
                status: paymentStatus,
              };
        const cancelReason =
          status === "CANCELLED"
            ? paymentStatus === "FAILED"
              ? "Payment provider declined the transaction."
              : "Customer requested a refund before dispatch."
            : null;
        const failureReason =
          paymentStatus === "FAILED"
            ? "Seeded as failed payment for dashboard coverage."
            : paymentStatus === "REFUNDED"
              ? "Seeded as refunded payment for dashboard coverage."
              : null;

        orders.push({
          acceptedAt,
          address,
          addressDistrict: district.district,
          addressKhoroo: district.khoroo,
          addressLabel,
          addressLatitude: latitudeBase,
          addressLongitude: longitudeBase,
          addressNotes,
          addressUnit,
          cancelReason,
          cancelledAt,
          contactPhone: customer.phone,
          courierId,
          createdAt,
          deliveredAt,
          id: `order-seed-${orderNumber}`,
          readyForCourierAt,
          status,
          totalPrice,
          userId: customerUserId,
        });

        for (const [itemIndex, item] of items.entries()) {
          orderItems.push({
            foodCategory: item.foodCategory,
            foodId: item.foodId,
            foodImage: item.foodImage,
            foodName: item.foodName,
            id: `order-item-seed-${orderNumber}-${itemIndex + 1}`,
            orderId: `order-seed-${orderNumber}`,
            price: item.price,
            quantity: item.quantity,
          });
        }

        payments.push({
          createdAt,
          failedAt,
          failureReason,
          id: `payment-seed-${orderNumber}`,
          method,
          orderId: `order-seed-${orderNumber}`,
          paidAt,
          providerPayload,
          providerReference,
          refundedAt,
          status: paymentStatus,
        });

        if (trackingStatus) {
          trackings.push({
            id: `tracking-seed-${orderNumber}`,
            latitude:
              trackingStatus === "PREPARING" ? null : latitudeBase + 0.0042,
            longitude:
              trackingStatus === "PREPARING" ? null : longitudeBase + 0.0038,
            orderId: `order-seed-${orderNumber}`,
            status: trackingStatus,
            updatedAt: deliveredAt ?? readyForCourierAt ?? acceptedAt ?? createdAt,
          });
        }
      }

      await tx.order.createMany({
        data: orders,
      });

      await tx.orderItem.createMany({
        data: orderItems,
      });

      await tx.payment.createMany({
        data: payments,
      });

      if (trackings.length > 0) {
        await tx.tracking.createMany({
          data: trackings,
        });
      }

      return {
        foodsUsed: availableFoods.length,
        ordersSeeded: orders.length,
        orderItemsSeeded: orderItems.length,
        paymentsSeeded: payments.length,
        trackingsSeeded: trackings.length,
      };
    });

    console.log(
      JSON.stringify({
        databaseUrl,
        ...summary,
      })
    );
  } finally {
    await prisma.$disconnect();
  }
}

await main();
