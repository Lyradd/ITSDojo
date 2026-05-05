import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/dosen/:path*',
        destination: '/admin/:path*',
      },
      {
        source: '/asdos/:path*',
        destination: '/admin/:path*',
      },
    ];
  },
};

export default nextConfig;
