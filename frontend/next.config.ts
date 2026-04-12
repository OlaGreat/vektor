import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required for InterwovenKit (uses browser-specific globals)
  experimental: {
    esmExternals: "loose",
  },
};

export default nextConfig;
