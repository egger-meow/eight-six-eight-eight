import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.8688bnb.com/api/v1";
const apiOrigin = new URL(apiUrl).origin;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.128", "localhost"],
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.8688bnb.com", pathname: "/uploads/**" },
      { protocol: "http", hostname: "localhost", port: "3333", pathname: "/uploads/**" },
      { protocol: "http", hostname: "192.168.1.128", port: "3333", pathname: "/uploads/**" },
      {
        protocol: apiOrigin.startsWith("https") ? "https" : "http",
        hostname: new URL(apiOrigin).hostname,
        port: new URL(apiOrigin).port,
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
