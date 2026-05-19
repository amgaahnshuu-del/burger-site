import { NextResponse } from "next/server";

import {
  isSupportedPaymentWebhookEvent,
  resolvePaymentWebhookStatus,
} from "@/lib/order-lifecycle";
import { prisma } from "@/lib/prisma";
import { createServerErrorResponse } from "@/lib/server-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedWebhookRequest(request: Request) {
  const configuredSecret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();

  if (!configuredSecret) {
    return "CONFIG_MISSING" as const;
  }

  const headerSecret = request.headers.get("x-payment-webhook-secret")?.trim();
  const bearerToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  const providedSecret = headerSecret || bearerToken || "";

  return providedSecret === configuredSecret;
}

export async function POST(request: Request) {
  const authorization = isAuthorizedWebhookRequest(request);

  if (authorization === "CONFIG_MISSING") {
    return NextResponse.json(
      { error: "PAYMENT_WEBHOOK_SECRET is not configured." },
      { status: 503 }
    );
  }

  if (!authorization) {
    return NextResponse.json(
      { error: "Invalid payment webhook secret." },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as {
      event?: unknown;
      orderId?: unknown;
      payload?: unknown;
      providerReference?: unknown;
      reason?: unknown;
    };

    const event = body.event;

    if (!isSupportedPaymentWebhookEvent(event)) {
      return NextResponse.json(
        { error: "Unsupported payment webhook event." },
        { status: 400 }
      );
    }

    const orderId =
      typeof body.orderId === "string" && body.orderId.trim()
        ? body.orderId.trim()
        : "";

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required." },
        { status: 400 }
      );
    }

    const providerReference =
      typeof body.providerReference === "string" && body.providerReference.trim()
        ? body.providerReference.trim()
        : null;
    const reason =
      typeof body.reason === "string" && body.reason.trim()
        ? body.reason.trim()
        : null;

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: {
          id: orderId,
        },
        include: {
          payment: true,
        },
      });

      if (!order?.payment) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      const resolution = resolvePaymentWebhookStatus(order.payment.status, event);

      if (!resolution) {
        throw new Error("INVALID_PAYMENT_TRANSITION");
      }

      const processedAt = new Date();
      const paymentData =
        event === "payment.succeeded"
          ? {
              failedAt: null,
              failureReason: null,
              paidAt: processedAt,
              providerPayload: body.payload ?? order.payment.providerPayload ?? undefined,
              providerReference: providerReference ?? order.payment.providerReference,
              status: resolution.nextStatus,
            }
          : event === "payment.failed"
            ? {
                failedAt: processedAt,
                failureReason: reason ?? "Payment provider reported a failed transaction.",
                providerPayload: body.payload ?? order.payment.providerPayload ?? undefined,
                providerReference: providerReference ?? order.payment.providerReference,
                status: resolution.nextStatus,
              }
            : {
                failureReason: reason ?? "Payment provider reported a refund.",
                providerPayload: body.payload ?? order.payment.providerPayload ?? undefined,
                providerReference: providerReference ?? order.payment.providerReference,
                refundedAt: processedAt,
                status: resolution.nextStatus,
              };

      await tx.payment.update({
        where: {
          orderId,
        },
        data: paymentData,
      });

      if (
        resolution.cancelOrder
        && order.status !== "CANCELLED"
        && order.status !== "DELIVERED"
      ) {
        await tx.order.update({
          where: {
            id: orderId,
          },
          data: {
            cancelReason: reason ?? `Automatic cancellation after ${event}.`,
            cancelledAt: processedAt,
            courierId: null,
            status: "CANCELLED",
          },
        });
      }

      return tx.payment.findUnique({
        where: {
          orderId,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      payment: updatedPayment,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYMENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Payment record not found for this order." },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message === "INVALID_PAYMENT_TRANSITION") {
      return NextResponse.json(
        { error: "This payment has already reached a final status." },
        { status: 409 }
      );
    }

    return createServerErrorResponse(
      "api/payments/webhook.POST",
      "Unable to process the payment webhook right now.",
      error
    );
  }
}
