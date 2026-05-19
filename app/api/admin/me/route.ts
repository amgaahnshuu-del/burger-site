import { NextResponse } from "next/server";

import { forbiddenResponse, getAuthSession, unauthorizedResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);

    if (!session) {
      return unauthorizedResponse();
    }

    if (session.user.role !== "ADMIN") {
      return forbiddenResponse();
    }

    return NextResponse.json({
      authenticated: true,
      user: session.user,
      expiresAt: session.expiresAt,
    });
  } catch {
    return unauthorizedResponse();
  }
}
