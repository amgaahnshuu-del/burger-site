import { NextResponse } from "next/server";

import { requireAuth, unauthorizedResponse } from "@/lib/auth";
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

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const { user } = await requireAuth(request);
    const rateLimit = checkRateLimit({
      identifier: `${user.id}:${getClientIdentifier(request)}`,
      key: "feedback-submit",
      limit: 5,
      windowMs: 1000 * 60 * 60,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        "Too many feedback submissions. Please wait a little and try again."
      );
    }

    const body = (await request.json()) as {
      message?: unknown;
      type?: unknown;
    };

    const message =
      typeof body.message === "string" ? body.message.trim() : "";
    const type =
      body.type === "COMPLAINT" || body.type === "SUGGESTION"
        ? body.type
        : null;

    if (!message || !type) {
      return NextResponse.json(
        { error: "Feedback type and message are required." },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        email: user.email,
        message,
        name: user.name,
        type,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    if (isTrustedOriginError(error)) {
      return untrustedOriginResponse();
    }

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return createServerErrorResponse(
      "api/feedback.POST",
      "Unable to send your feedback right now.",
      error
    );
  }
}
