import { clearSessionCookie, deleteSessionFromRequest } from "@/lib/auth";
import {
  assertTrustedOrigin,
  isTrustedOriginError,
  untrustedOriginResponse,
} from "@/lib/request-security";
import { createServerErrorResponse } from "@/lib/server-error";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const response = NextResponse.json({
      message: "Logged out successfully.",
    });

    await deleteSessionFromRequest(request);
    clearSessionCookie(request, response);

    return response;
  } catch (error) {
    if (isTrustedOriginError(error)) {
      return untrustedOriginResponse();
    }

    return createServerErrorResponse(
      "api/auth/logout",
      "Unable to log out right now.",
      error
    );
  }
}
