import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    host: siteUrl.origin,
    rules: {
      allow: "/",
      disallow: ["/admin", "/api/", "/courier", "/manager", "/protected/"],
      userAgent: "*",
    },
    sitemap: `${siteUrl.origin}/sitemap.xml`,
  };
}
