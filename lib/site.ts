export const APP_DESCRIPTION =
  "Burger delivers premium burgers across Ulaanbaatar with live tracking, kitchen dispatch, and AI-assisted ordering support.";

function isLocalhostHostname(hostname: string) {
  return (
    hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "0.0.0.0"
  );
}

function parseAbsoluteUrl(value: string | null | undefined) {
  const candidate = value?.trim();

  if (!candidate) {
    return null;
  }

  try {
    return new URL(candidate);
  } catch {
    return null;
  }
}

function parseHostAsUrl(host: string | null | undefined) {
  const candidate = host?.trim();

  if (!candidate) {
    return null;
  }

  try {
    return new URL(`https://${candidate}`);
  } catch {
    return null;
  }
}

export function getSiteUrl() {
  const explicitUrl = parseAbsoluteUrl(process.env.NEXT_PUBLIC_APP_URL);

  if (
    explicitUrl
    && (
      process.env.NODE_ENV !== "production"
      || !isLocalhostHostname(explicitUrl.hostname)
    )
  ) {
    return explicitUrl;
  }

  const vercelProductionUrl = parseHostAsUrl(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  );

  if (vercelProductionUrl) {
    return vercelProductionUrl;
  }

  const vercelPreviewUrl = parseHostAsUrl(process.env.VERCEL_URL);

  if (vercelPreviewUrl) {
    return vercelPreviewUrl;
  }

  return explicitUrl ?? new URL("http://localhost:3000");
}
