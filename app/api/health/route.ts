import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  let database: "ok" | "down" = "down";

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    database = "ok";
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "burger",
        environment: process.env.NODE_ENV,
        checks: {
          database: "down",
          paymentWebhookConfigured: Boolean(process.env.PAYMENT_WEBHOOK_SECRET?.trim()),
        },
        responseTimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === "development" && error instanceof Error
          ? { error: error.message }
          : {}),
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    service: "burger",
    environment: process.env.NODE_ENV,
    checks: {
      database,
      paymentWebhookConfigured: Boolean(process.env.PAYMENT_WEBHOOK_SECRET?.trim()),
    },
    responseTimeMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
}
