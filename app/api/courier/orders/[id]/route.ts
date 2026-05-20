import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma";
import type { OrderStatus } from "@/generated/prisma/client";
import { forbiddenResponse, requireCourier, unauthorizedResponse } from "@/lib/auth";
import { sanitizeCourierAvailableOrder } from "@/lib/courier-order-security";
import {
  createDeliveryVerificationCode,
  getDeliveryVerificationExpiryDate,
  getDeliveryVerificationMaxAttempts,
  getPublicDeliveryVerification,
  hashDeliveryVerificationCode,
  sendDeliveryVerificationCode,
  verifyDeliveryVerificationCode,
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
      code?: unknown;
      latitude?: unknown;
      longitude?: unknown;
    };

    const action =
      body.action === "claim" ||
      body.action === "request-complete" ||
      body.action === "verify-complete"
        ? body.action
        : null;
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const latitude = parseCoordinate(body.latitude);
    const longitude = parseCoordinate(body.longitude);

    if (!action && latitude === null && longitude === null) {
      return NextResponse.json(
        { error: "Provide an action or live location coordinates." },
        { status: 400 }
      );
    }

    let preparedDeliveryVerification:
      | {
          channel: string;
          codeHash: string;
          expiresAt: Date;
          recipientEmail: string | null;
          recipientPhone: string | null;
          sentAt: Date;
        }
      | null = null;

    if (action === "request-complete") {
      const orderForDeliveryCode = await prisma.order.findUnique({
        where: {
          id,
        },
        include: {
          user: {
            select: orderPartySelect,
          },
        },
      });

      if (!orderForDeliveryCode) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (orderForDeliveryCode.status === "CANCELLED") {
        throw new Error("ORDER_CANCELLED");
      }

      if (orderForDeliveryCode.status === "DELIVERED") {
        throw new Error("ORDER_DELIVERED");
      }

      if (orderForDeliveryCode.courierId !== user.id) {
        throw new Error("COURIER_MISMATCH");
      }

      if (orderForDeliveryCode.status !== "DELIVERING") {
        throw new Error("ORDER_NOT_ACTIVE_DELIVERY");
      }

      const deliveryEmail =
        orderForDeliveryCode.user?.email?.trim().toLowerCase() ||
        "";

      if (!deliveryEmail) {
        throw new Error("CUSTOMER_EMAIL_MISSING");
      }

      const deliveryCode = createDeliveryVerificationCode();
      const expiresAt = getDeliveryVerificationExpiryDate();
      const sentAt = new Date();
      const notificationResult = await sendDeliveryVerificationCode({
        code: deliveryCode,
        customerEmail: deliveryEmail,
        orderId: orderForDeliveryCode.id,
        phone:
          orderForDeliveryCode.contactPhone?.trim() ||
          orderForDeliveryCode.user?.phone?.trim() ||
          null,
      });

      preparedDeliveryVerification = {
        channel: notificationResult.channel,
        codeHash: await hashDeliveryVerificationCode(deliveryCode),
        expiresAt,
        recipientEmail: notificationResult.recipientEmail,
        recipientPhone: notificationResult.recipientPhone,
        sentAt,
      };
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
      } else if (action === "request-complete") {
        if (currentOrder.courierId !== user.id) {
          throw new Error("COURIER_MISMATCH");
        }

        if (currentOrder.status !== "DELIVERING") {
          throw new Error("ORDER_NOT_ACTIVE_DELIVERY");
        }

        if (!preparedDeliveryVerification) {
          throw new Error("DELIVERY_CODE_NOT_PREPARED");
        }

        await tx.deliveryVerification.upsert({
          where: {
            orderId: id,
          },
          create: {
            orderId: id,
            attempts: 0,
            channel: preparedDeliveryVerification.channel,
            codeHash: preparedDeliveryVerification.codeHash,
            expiresAt: preparedDeliveryVerification.expiresAt,
            lastSentAt: preparedDeliveryVerification.sentAt,
            recipientEmail: preparedDeliveryVerification.recipientEmail,
            recipientPhone: preparedDeliveryVerification.recipientPhone,
          },
          update: {
            attempts: 0,
            channel: preparedDeliveryVerification.channel,
            codeHash: preparedDeliveryVerification.codeHash,
            expiresAt: preparedDeliveryVerification.expiresAt,
            lastSentAt: preparedDeliveryVerification.sentAt,
            recipientEmail: preparedDeliveryVerification.recipientEmail,
            recipientPhone: preparedDeliveryVerification.recipientPhone,
            verifiedAt: null,
          },
        });
      } else if (action === "verify-complete") {
        if (currentOrder.courierId !== user.id) {
          throw new Error("COURIER_MISMATCH");
        }

        if (currentOrder.status !== "DELIVERING") {
          throw new Error("ORDER_NOT_ACTIVE_DELIVERY");
        }

        if (!currentOrder.deliveryVerification) {
          throw new Error("DELIVERY_CODE_NOT_REQUESTED");
        }

        if (!code) {
          throw new Error("DELIVERY_CODE_REQUIRED");
        }

        if (
          currentOrder.deliveryVerification.expiresAt.getTime() <= Date.now()
        ) {
          throw new Error("DELIVERY_CODE_EXPIRED");
        }

        if (
          currentOrder.deliveryVerification.attempts >=
          getDeliveryVerificationMaxAttempts()
        ) {
          throw new Error("DELIVERY_CODE_TOO_MANY_ATTEMPTS");
        }

        const isCodeValid = await verifyDeliveryVerificationCode(
          code,
          currentOrder.deliveryVerification.codeHash
        );

        if (!isCodeValid) {
          await tx.deliveryVerification.update({
            where: {
              orderId: id,
            },
            data: {
              attempts: {
                increment: 1,
              },
            },
          });

          throw new Error("DELIVERY_CODE_INVALID");
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

        await tx.deliveryVerification.update({
          where: {
            orderId: id,
          },
          data: {
            verifiedAt: deliveredAt,
          },
        });
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

    if (error instanceof Error && error.message === "CUSTOMER_EMAIL_MISSING") {
      return NextResponse.json(
        { error: "The customer email is missing for this delivery." },
        { status: 400 }
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

    if (
      error instanceof Error &&
      error.message === "DELIVERY_CODE_REQUIRED"
    ) {
      return NextResponse.json(
        { error: "Enter the customer delivery code to complete this order." },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "DELIVERY_CODE_NOT_REQUESTED"
    ) {
      return NextResponse.json(
        { error: "Send a delivery confirmation code before completing this order." },
        { status: 409 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "DELIVERY_CODE_EXPIRED"
    ) {
      return NextResponse.json(
        { error: "The delivery confirmation code has expired. Send a new one." },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "DELIVERY_CODE_TOO_MANY_ATTEMPTS"
    ) {
      return NextResponse.json(
        { error: "Too many incorrect codes. Send a new delivery code." },
        { status: 429 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "DELIVERY_CODE_INVALID"
    ) {
      return NextResponse.json(
        { error: "The delivery confirmation code is incorrect." },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "SMTP_NOT_CONFIGURED"
    ) {
      return NextResponse.json(
        {
          error:
            "Email delivery is not configured. Add valid SMTP settings before sending customer delivery codes.",
        },
        { status: 503 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "SMTP_AUTH_FAILED"
    ) {
      return NextResponse.json(
        {
          error:
            "Email login failed. Check SMTP_USER, SMTP_PASS, and SMTP_FROM.",
        },
        { status: 503 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "SMTP_CONNECTION_FAILED"
    ) {
      return NextResponse.json(
        {
          error:
            "Unable to reach the email provider right now. Check the SMTP server and try again.",
        },
        { status: 503 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "DELIVERY_CODE_DELIVERY_UNAVAILABLE"
    ) {
      return NextResponse.json(
        {
          error:
            "No email delivery channel is configured. Add a customer email address and valid SMTP settings before sending codes.",
        },
        { status: 503 }
      );
    }

    return createServerErrorResponse(
      "api/courier/orders/[id].PATCH",
      "Unable to update the courier order right now.",
      error
    );
  }
}
