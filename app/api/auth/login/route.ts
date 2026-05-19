import { createUserSession, setSessionCookie } from "@/lib/auth";
import { getOrBootstrapDefaultAdmin } from "@/lib/default-admin";
import { getOrBootstrapDefaultCourier } from "@/lib/default-courier";
import { getOrBootstrapDefaultManager } from "@/lib/default-manager";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
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
    };

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password =
      typeof body.password === "string" ? body.password.trim() : "";

    const rateLimit = checkRateLimit({
      identifier: `${getClientIdentifier(req)}:${email || "anonymous"}`,
      key: "auth-login",
      limit: 5,
      windowMs: 1000 * 60 * 10,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        "Too many login attempts. Please wait a few minutes and try again."
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

    const user =
      existingUser
      ?? await getOrBootstrapDefaultAdmin(email)
      ?? await getOrBootstrapDefaultManager(email)
      ?? await getOrBootstrapDefaultCourier(email);

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

    const session = await createUserSession(user.id);
    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    });

    setSessionCookie(req, response, session.token, session.expiresAt);

    return response;
  } catch (error) {
    return createServerErrorResponse(
      "api/auth/login",
      "Unable to log in right now.",
      error
    );
  }
}
