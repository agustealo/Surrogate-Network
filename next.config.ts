import type { NextConfig } from 'next'

import { getPublicRuntimeConfig } from './src/infrastructure/config/runtimeConfig'
import { buildSecurityHeaders } from './src/infrastructure/security/securityHeaders'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [],
  },
  async headers() {
    const config = getPublicRuntimeConfig()

    return [
      {
        source: '/(.*)',
        headers: buildSecurityHeaders({
          supabaseUrl: config.supabaseUrl,
        }),
      },
    ]
  },
}

export default nextConfig
