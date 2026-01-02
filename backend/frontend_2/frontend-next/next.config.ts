import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Rewrites are not supported in static export. 
  // For local development with the backend, you may need to use a separate proxy or full URLs.
};

export default nextConfig;
