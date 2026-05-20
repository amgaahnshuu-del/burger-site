import { NextResponse } from "next/server";

import {
  createGoogleAuthorizationUrl,
  createGoogleAuthErrorUrl,
  createGoogleOAuthState,
  getGoogleAuthView,
  normalizeAppRedirectPath,
  setGoogleOAuthCookies,
} from "@/lib/google-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectPath = normalizeAppRedirectPath(url.searchParams.get("redirect"));
  const view = getGoogleAuthView(url.searchParams.get("source"));

  try {
    const state = createGoogleOAuthState();
    const authorizationUrl = createGoogleAuthorizationUrl(request, state);
    const response = NextResponse.redirect(authorizationUrl);

    setGoogleOAuthCookies(request, response, {
      redirectPath,
      state,
      view,
    });

    return response;
  } catch (error) {
    console.error("[api/auth/google/start]", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
            }
          : error,
      redirectPath,
      requestUrl: request.url,
      timestamp: new Date().toISOString(),
      view,
    });

    const message =
      error instanceof Error && error.message === "GOOGLE_OAUTH_NOT_CONFIGURED"
        ? "Google login тохируулагдаагүй байна. GOOGLE_CLIENT_ID болон GOOGLE_CLIENT_SECRET утгуудаа нэмнэ үү."
        : "Google login эхлүүлэх үед алдаа гарлаа. Дахин оролдоно уу.";

    return NextResponse.redirect(
      createGoogleAuthErrorUrl(request, {
        message,
        redirectPath,
        view,
      })
    );
  }
}
