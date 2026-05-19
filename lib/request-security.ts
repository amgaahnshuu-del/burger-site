import { NextResponse } from "next/server";

const UNTRUSTED_ORIGIN_ERROR = "UNTRUSTED_ORIGIN";

function getAllowedOrigins(request: Request) {
  const allowedOrigins = new Set<string>();

  try {
    allowedOrigins.add(new URL(request.url).origin);
  } catch {
    return allowedOrigins;
  }

  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredAppUrl) {
    try {
      allowedOrigins.add(new URL(configuredAppUrl).origin);
    } catch {
      // Ignore invalid app URL configuration here and fall back to request origin.
    }
  }

  return allowedOrigins;
}

function hasTrustedOrigin(value: string | null, allowedOrigins: Set<string>) {
  if (!value) {
    return false;
  }

  try {
    return allowedOrigins.has(new URL(value).origin);
  } catch {
    return false;
  }
}

export function assertTrustedOrigin(request: Request) {
  const allowedOrigins = getAllowedOrigins(request);

  if (allowedOrigins.size === 0) {
    return;
  }

  const origin = request.headers.get("origin");

  if (origin && allowedOrigins.has(origin)) {
    return;
  }

  const referer = request.headers.get("referer");

  if (hasTrustedOrigin(referer, allowedOrigins)) {
    return;
  }

  const fetchSite = request.headers.get("sec-fetch-site");

  if (
    !origin
    && !referer
    && (fetchSite === "same-origin" || fetchSite === "same-site" || fetchSite === "none")
  ) {
    return;
  }

  throw new Error(UNTRUSTED_ORIGIN_ERROR);
}

export function isTrustedOriginError(error: unknown) {
  return error instanceof Error && error.message === UNTRUSTED_ORIGIN_ERROR;
}

export function untrustedOriginResponse() {
  return NextResponse.json(
    {
      error: "Blocked a suspicious cross-site request. Refresh the page and try again.",
    },
    { status: 403 }
  );
}
