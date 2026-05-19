import type { MetadataRoute } from "next";

import { APP_NAME } from "@/lib/constants";
import { APP_DESCRIPTION } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#09090a",
    description: APP_DESCRIPTION,
    display: "standalone",
    icons: [
      {
        sizes: "512x512",
        src: "/logo.png",
        type: "image/png",
      },
    ],
    name: APP_NAME,
    short_name: APP_NAME,
    start_url: "/",
    theme_color: "#ff6a00",
  };
}
