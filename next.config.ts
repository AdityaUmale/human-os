import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["swisseph-v2"],
  outputFileTracingIncludes: {
    "/*": [
      "./public/ephe/**/*",
      "./node_modules/swisseph-v2/build/Release/swisseph.node",
    ],
  },
};

export default nextConfig;
