import type { MetadataRoute } from "next";
import rooms from "@/data/rooms.json";

const siteUrl = "https://8688bnb.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/rooms`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/booking-info`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/booking`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/location`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/cats`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const roomRoutes: MetadataRoute.Sitemap = rooms.map((room) => ({
    url: `${siteUrl}/rooms/${room.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: room.type === "quad" ? 0.8 : 0.75,
  }));

  return [...staticRoutes, ...roomRoutes];
}
