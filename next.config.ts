import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // typedRoutes is dynamic; turning off avoids stale type errors during dev.
  typedRoutes: false,
};

export default nextConfig;
