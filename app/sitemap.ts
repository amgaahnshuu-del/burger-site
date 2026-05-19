import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

const PUBLIC_ROUTES = [
  "/",
  "/public",
  "/public/explore",
  "/ai-assistant",
  "/menu",
  "/track-order",
  "/privacy",
  "/terms",
  "/refund-policy",
  "/contact",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    changeFrequency: route === "/" ? "daily" : "weekly",
    lastModified,
    priority: route === "/" ? 1 : 0.6,
    url: new URL(route, siteUrl).toString(),
  }));
}
