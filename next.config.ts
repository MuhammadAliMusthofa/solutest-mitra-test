import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Docker/Cloud Run memakai output standalone (diaktifkan lewat env di Dockerfile).
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  poweredByHeader: false,
  images: {
    // Logo mitra bisa berasal dari storage mana saja (diunggah admin mitra).
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
