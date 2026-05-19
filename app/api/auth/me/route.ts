import {
  clearSessionCookie,
  getAuthSession,
  hasSessionCookie,
  requireAuth,
} from "@/lib/auth";
import { getClientIdentifier, checkRateLimit, createRateLimitResponse } from "@/lib/rate-limit";
import {
  assertTrustedOrigin,
  isTrustedOriginError,
  untrustedOriginResponse,
} from "@/lib/request-security";
import { prisma } from "@/lib/prisma";
import { createServerErrorResponse } from "@/lib/server-error";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);

    if (!session) {
      const response = NextResponse.json({
        authenticated: false,
        user: null,
        expiresAt: null,
      });

      if (hasSessionCookie(request)) {
        clearSessionCookie(request, response);
      }

      return response;
    }

    return NextResponse.json({
      authenticated: true,
      user: session.user,
      expiresAt: session.expiresAt,
    });
  } catch {
    return NextResponse.json({
      authenticated: false,
      user: null,
      expiresAt: null,
    });
  }
}

export async function PATCH(request: Request) {
  try {
    assertTrustedOrigin(request);
    const { user } = await requireAuth(request);
    const body = (await request.json()) as {
      email?: unknown;
      name?: unknown;
      phone?: unknown;
    };

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone =
      typeof body.phone === "string" && body.phone.trim()
        ? body.phone.trim()
        : null;

    const rateLimit = checkRateLimit({
      identifier: `${user.id}:${getClientIdentifier(request)}`,
      key: "account-update",
      limit: 20,
      windowMs: 1000 * 60 * 60,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        "Too many account updates. Please wait a little before trying again."
      );
    }

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
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

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json(
        { error: "That email address is already in use." },
        { status: 409 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        email,
        name,
        phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (isTrustedOriginError(error)) {
      return untrustedOriginResponse();
    }

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      const response = NextResponse.json(
        { error: "You must be logged in to access this resource." },
        { status: 401 }
      );

      if (hasSessionCookie(request)) {
        clearSessionCookie(request, response);
      }

      return response;
    }

    return createServerErrorResponse(
      "api/auth/me",
      "Unable to update your account right now.",
      error
    );
  }
}
