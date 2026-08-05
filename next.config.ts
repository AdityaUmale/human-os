import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["swisseph-v2"],
  outputFileTracingIncludes: {
    "/*": ["./public/ephe/**/*"],
  },
};

export default nextConfig;
