import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove trailingSlash for Vercel deployment
  // trailingSlash: true,
  
  // Keep images optimized for better performance
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Add experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
