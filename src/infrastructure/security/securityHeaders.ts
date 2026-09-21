export type SecurityHeader = {
  key: string
  value: string
}

function configuredSupabaseSources(supabaseUrl: string | undefined) {
  if (!supabaseUrl) {
    return { httpOrigin: null, websocketOrigin: null }
  }

  let url: URL
  try {
    url = new URL(supabaseUrl)
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid absolute URL')
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must use http or https')
  }

  const websocketUrl = new URL(url.origin)
  websocketUrl.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

  return {
    httpOrigin: url.origin,
    websocketOrigin: websocketUrl.origin,
  }
}

export function buildContentSecurityPolicy(supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const { httpOrigin, websocketOrigin } = configuredSupabaseSources(supabaseUrl)
  const connectionSources = ["'self'"]
  const assetSources = ["'self'", 'data:', 'blob:']
  const mediaSources = ["'self'", 'blob:']

  if (httpOrigin) {
    connectionSources.push(httpOrigin)
    assetSources.push(httpOrigin)
    mediaSources.push(httpOrigin)
  }

  if (websocketOrigin) {
    connectionSources.push(websocketOrigin)
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    `img-src ${assetSources.join(' ')}`,
    `connect-src ${connectionSources.join(' ')}`,
    `media-src ${mediaSources.join(' ')}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join('; ')
}

export function buildSecurityHeaders(options?: {
  nodeEnv?: string
  supabaseUrl?: string
}): SecurityHeader[] {
  const nodeEnv = options?.nodeEnv ?? process.env.NODE_ENV
  const headers: SecurityHeader[] = [
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy(options?.supabaseUrl) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
    { key: 'X-DNS-Prefetch-Control', value: 'off' },
  ]

  if (nodeEnv === 'production') {
    headers.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000' })
  }

  return headers
}
