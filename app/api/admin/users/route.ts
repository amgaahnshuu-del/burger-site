import { NextResponse } from "next/server";

import { forbiddenResponse, requireAdmin, unauthorizedResponse } from "@/lib/auth";
import { getPasswordValidationError, hashPassword } from "@/lib/password";
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
    const { user: admin } = await requireAdmin(request);
    const body = (await request.json()) as {
      email?: unknown;
      name?: unknown;
      password?: unknown;
      phone?: unknown;
      role?: unknown;
    };

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const password = typeof body.password === "string" ? body.password.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const role = (
      body.role === "CUSTOMER"
      || body.role === "MANAGER"
      || body.role === "COURIER"
    ) ? body.role : null;

    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and a valid role are required." },
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

    const rateLimit = checkRateLimit({
      identifier: `${admin.id}:${getClientIdentifier(request)}`,
      key: "admin-users-write",
      limit: 30,
      windowMs: 1000 * 60 * 60,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        "Too many admin account changes. Please wait a bit and try again."
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const createdUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phone: phone || null,
        role,
        ...(role === "CUSTOMER"
          ? {
              cart: {
                create: {},
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json(
      {
        id: createdUser.id,
        message:
          role === "COURIER"
            ? "Courier created successfully."
            : role === "MANAGER"
              ? "Manager created successfully."
              : "User created successfully.",
      },
      { status: 201 }
    );
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

    return createServerErrorResponse(
      "api/admin/users.POST",
      "Unable to create the account right now.",
      error
    );
  }
}
