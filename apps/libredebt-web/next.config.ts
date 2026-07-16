import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // 1. Tell Next.js 16 we acknowledge Turbopack is active (this silences the error)
  turbopack: {},
};

export default nextConfig;
