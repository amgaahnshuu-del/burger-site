import { startRegistrationVerification } from "@/lib/pending-registration";
import { getPasswordValidationError } from "@/lib/password";
import {
  checkRateLimit,
  createRateLimitResponse,
  getClientIdentifier,
} from "@/lib/rate-limit";
import { createServerErrorResponse } from "@/lib/server-error";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: unknown;
      password?: unknown;
      name?: unknown;
    };

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password =
      typeof body.password === "string" ? body.password.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    const rateLimit = checkRateLimit({
      identifier: `${getClientIdentifier(req)}:${email || "anonymous"}`,
      key: "auth-register",
      limit: 3,
      windowMs: 1000 * 60 * 15,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        "Too many registration attempts. Please wait a little and try again."
      );
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const passwordValidationError = getPasswordValidationError(password);

    if (passwordValidationError) {
      return NextResponse.json(
        { error: passwordValidationError },
        { status: 400 }
      );
    }

    const verification = await startRegistrationVerification({
      email,
      name,
      password,
    });

    return NextResponse.json(verification, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      return NextResponse.json(
        { error: "Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна. Нэвтэрч орно уу." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "SMTP_NOT_CONFIGURED") {
      return NextResponse.json(
        {
          error:
            "Verification email service is not configured. Add SMTP settings before using email verification.",
        },
        { status: 503 }
      );
    }

    if (error instanceof Error && error.message === "SMTP_AUTH_FAILED") {
      return NextResponse.json(
        {
          error:
            "SMTP login failed. Check SMTP_USER and use a valid Gmail App Password for SMTP_PASS.",
        },
        { status: 503 }
      );
    }

    if (error instanceof Error && error.message === "SMTP_CONNECTION_FAILED") {
      return NextResponse.json(
        {
          error:
            "Unable to connect to the SMTP server right now. Check SMTP_HOST, SMTP_PORT, and your network access.",
        },
        { status: 503 }
      );
    }

    return createServerErrorResponse(
      "api/auth/register",
      "Unable to send the verification code right now.",
      error
    );
  }
}
