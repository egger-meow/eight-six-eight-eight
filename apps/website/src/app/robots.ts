import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://8688bnb.com/sitemap.xml",
    host: "https://8688bnb.com",
  };
}
