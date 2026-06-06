import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // node-ical/rrule rely on Node-internal BigInt — exclude from Webpack bundle
  // so they're require()'d at runtime instead of minified (which breaks BigInt).
  serverExternalPackages: ["node-ical", "rrule"],
};

export default nextConfig;
