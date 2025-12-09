import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/analyze',
        destination: 'http://localhost:8080/analyze',
      },
      {
        source: '/reports',
        destination: 'http://localhost:8080/reports',
      },
    ];
  },
};

export default nextConfig;
