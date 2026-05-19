import { NextResponse } from "next/server";

import { createUserSession, setSessionCookie } from "@/lib/auth";
import { getOrBootstrapDefaultAdmin } from "@/lib/default-admin";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
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
      email?: unknown;
      password?: unknown;
    };

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password =
      typeof body.password === "string" ? body.password.trim() : "";

    const rateLimit = checkRateLimit({
      identifier: `${getClientIdentifier(request)}:${email || "anonymous"}`,
      key: "admin-login",
      limit: 5,
      windowMs: 1000 * 60 * 10,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        "Too many admin login attempts. Please wait a few minutes and try again."
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    const user = existingUser ?? await getOrBootstrapDefaultAdmin(email);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "This account does not have admin access." },
        { status: 403 }
      );
    }

    const session = await createUserSession(user.id);
    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    });

    setSessionCookie(request, response, session.token, session.expiresAt);

    return response;
  } catch (error) {
    return createServerErrorResponse(
      "api/admin/login",
      "Unable to log in to the admin panel right now.",
      error
    );
  }
}
