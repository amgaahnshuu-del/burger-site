import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";
const GOOGLE_OAUTH_REDIRECT_COOKIE = "google_oauth_redirect";
const GOOGLE_OAUTH_VIEW_COOKIE = "google_oauth_view";
const GOOGLE_OAUTH_COOKIE_MAX_AGE_SECONDS = 60 * 10;

type GoogleAuthView = "login" | "register";

function parseCookies(header: string | null) {
  const cookieMap = new Map<string, string>();

  if (!header) {
    return cookieMap;
  }

  for (const part of header.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");

    if (!rawName || rawValue.length === 0) {
      continue;
    }

    cookieMap.set(rawName, decodeURIComponent(rawValue.join("=")));
  }

  return cookieMap;
}

function shouldUseSecureCookie(request: Request) {
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export function getGoogleAuthView(value: string | null | undefined): GoogleAuthView {
  return value === "register" ? "register" : "login";
}

export function getGoogleAuthPagePath(view: GoogleAuthView) {
  return view === "register" ? "/auth/register" : "/auth/login";
}

export function normalizeAppRedirectPath(
  value: string | null | undefined,
  fallback = "/"
) {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  return trimmed;
}

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  const redirectUriOverride = process.env.GOOGLE_REDIRECT_URI?.trim() ?? "";

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_OAUTH_NOT_CONFIGURED");
  }

  return {
    clientId,
    clientSecret,
    redirectUriOverride,
  };
}

export function getGoogleRedirectUri(request: Request) {
  const { redirectUriOverride } = getGoogleOAuthConfig();

  if (redirectUriOverride) {
    return redirectUriOverride;
  }

  return new URL("/api/auth/google/callback", request.url).toString();
}

export function createGoogleOAuthState() {
  return randomBytes(24).toString("hex");
}

export function createGoogleAuthorizationUrl(
  request: Request,
  state: string
) {
  const { clientId } = getGoogleOAuthConfig();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getGoogleRedirectUri(request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  return url.toString();
}

export function setGoogleOAuthCookies(
  request: Request,
  response: NextResponse,
  options: {
    redirectPath: string;
    state: string;
    view: GoogleAuthView;
  }
) {
  const secure = shouldUseSecureCookie(request);
  const sharedCookieOptions = {
    httpOnly: true,
    maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure,
  };

  response.cookies.set({
    name: GOOGLE_OAUTH_STATE_COOKIE,
    value: options.state,
    ...sharedCookieOptions,
  });
  response.cookies.set({
    name: GOOGLE_OAUTH_REDIRECT_COOKIE,
    value: options.redirectPath,
    ...sharedCookieOptions,
  });
  response.cookies.set({
    name: GOOGLE_OAUTH_VIEW_COOKIE,
    value: options.view,
    ...sharedCookieOptions,
  });
}

export function readGoogleOAuthCookies(request: Request) {
  const cookies = parseCookies(request.headers.get("cookie"));

  return {
    redirectPath: normalizeAppRedirectPath(
      cookies.get(GOOGLE_OAUTH_REDIRECT_COOKIE),
      "/"
    ),
    state: cookies.get(GOOGLE_OAUTH_STATE_COOKIE) ?? null,
    view: getGoogleAuthView(cookies.get(GOOGLE_OAUTH_VIEW_COOKIE)),
  };
}

export function clearGoogleOAuthCookies(
  request: Request,
  response: NextResponse
) {
  const secure = shouldUseSecureCookie(request);

  for (const name of [
    GOOGLE_OAUTH_STATE_COOKIE,
    GOOGLE_OAUTH_REDIRECT_COOKIE,
    GOOGLE_OAUTH_VIEW_COOKIE,
  ]) {
    response.cookies.set({
      name,
      value: "",
      expires: new Date(0),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure,
    });
  }
}

export function createGoogleAuthErrorUrl(
  request: Request,
  options: {
    message: string;
    redirectPath: string;
    view: GoogleAuthView;
  }
) {
  const url = new URL(getGoogleAuthPagePath(options.view), request.url);

  if (options.redirectPath !== "/") {
    url.searchParams.set("redirect", options.redirectPath);
  }

  url.searchParams.set("error", options.message);

  return url;
}
