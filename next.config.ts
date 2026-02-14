import type { NextConfig } from "next";

const isMobile = process.env.MOBILE_BUILD === 'true';

const nextConfig: NextConfig = {
  output: isMobile ? 'export' : undefined,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
