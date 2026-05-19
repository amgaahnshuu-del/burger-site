import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth";
import { verifyRegistrationCode } from "@/lib/pending-registration";
import {
  checkRateLimit,
  createRateLimitResponse,
  getClientIdentifier,
} from "@/lib/rate-limit";
import { createServerErrorResponse } from "@/lib/server-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      code?: unknown;
      email?: unknown;
    };
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";

    const rateLimit = checkRateLimit({
      identifier: `${getClientIdentifier(request)}:${email || "anonymous"}`,
      key: "auth-register-verify",
      limit: 5,
      windowMs: 1000 * 60 * 15,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        "Too many verification attempts. Please request a new code or try again later."
      );
    }

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required." },
        { status: 400 }
      );
    }

    const result = await verifyRegistrationCode({
      code,
      email,
    });
    const response = NextResponse.json(result.user);

    setSessionCookie(
      request,
      response,
      result.session.token,
      result.session.expiresAt
    );

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      return NextResponse.json(
        { error: "Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна. Нэвтэрч орно уу." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "VERIFICATION_NOT_FOUND") {
      return NextResponse.json(
        { error: "Verification request not found. Please request a new code." },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message === "VERIFICATION_EXPIRED") {
      return NextResponse.json(
        { error: "The verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "VERIFICATION_TOO_MANY_ATTEMPTS"
    ) {
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new code." },
        { status: 429 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "VERIFICATION_CODE_INVALID"
    ) {
      return NextResponse.json(
        { error: "The verification code is incorrect." },
        { status: 400 }
      );
    }

    return createServerErrorResponse(
      "api/auth/register/verify",
      "Unable to verify the email code right now.",
      error
    );
  }
}
