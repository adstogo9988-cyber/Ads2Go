import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  trailingSlash: false,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
