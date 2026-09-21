import type { NextConfig } from 'next'

import { buildSecurityHeaders } from './src/infrastructure/security/securityHeaders'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: buildSecurityHeaders(),
      },
    ]
  },
}

export default nextConfig
