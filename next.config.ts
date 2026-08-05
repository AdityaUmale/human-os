import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["swisseph"],
  outputFileTracingIncludes: {
    "/*": ["./public/ephe/**/*"],
  },
};

export default nextConfig;
