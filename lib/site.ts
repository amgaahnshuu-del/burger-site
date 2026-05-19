export const APP_DESCRIPTION =
  "Burgernaut delivers premium burgers across Ulaanbaatar with live tracking, kitchen dispatch, and AI-assisted ordering support.";

export function getSiteUrl() {
  const candidate = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

  try {
    return new URL(candidate);
  } catch {
    return new URL("http://localhost:3000");
  }
}
