import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Dosen shared admin pages (excluding courses, evaluations, leaderboard, settings, etc.)
      {
        source: '/dosen/enrollments/:path*',
        destination: '/admin/enrollments/:path*',
      },
      {
        source: '/dosen/students/:path*',
        destination: '/admin/students/:path*',
      },
      {
        source: '/dosen/analytics/:path*',
        destination: '/admin/analytics/:path*',
      },

      // Asdos shared admin pages
      {
        source: '/asdos/courses/:path*',
        destination: '/admin/courses/:path*',
      },
      {
        source: '/asdos/enrollments/:path*',
        destination: '/admin/enrollments/:path*',
      },
      {
        source: '/asdos/students/:path*',
        destination: '/admin/students/:path*',
      },
      {
        source: '/asdos/analytics/:path*',
        destination: '/admin/analytics/:path*',
      },
    ];
  },
};

export default nextConfig;
