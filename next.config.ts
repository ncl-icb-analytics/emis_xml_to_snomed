import type { NextConfig } from 'next';

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    // Increase request body size limit for API routes (default is 10MB)
    proxyClientMaxBodySize: '50mb',
  },
  // Top-level option as mentioned in error message
  // This might not be in TypeScript types yet but is valid in Next.js 15.5
  middlewareClientMaxBodySize: '50mb',
} satisfies NextConfig;

export default nextConfig;
