import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  compress: true,
  // Optimize images served by Next.js
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  // Permanent redirect: browsers cache it after first visit → zero server roundtrip
  async redirects() {
    return [
      {
        source: "/",
        destination: "/areas",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

