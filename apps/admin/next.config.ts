import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.128", "localhost"],
  output: "standalone",
  deploymentId: process.env.NEXT_DEPLOYMENT_ID,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "8688bnb.com",
        port: "",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "api.8688bnb.com",
        port: "",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
