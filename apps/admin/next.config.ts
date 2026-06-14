import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.128", "localhost"],
  output: "standalone",
  deploymentId: process.env.NEXT_DEPLOYMENT_ID,
};

export default nextConfig;
