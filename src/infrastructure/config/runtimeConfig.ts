export type PublicRuntimeConfigSource = {
  supabaseUrl?: string
  supabaseAnonKey?: string
}

export type PublicRuntimeConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
}

function requireRuntimeValue(value: string | undefined, name: string) {
  const normalized = value?.trim()
  if (!normalized) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return normalized
}

export function normalizeSupabaseUrl(value: string | undefined) {
  const rawUrl = requireRuntimeValue(value, 'NEXT_PUBLIC_SUPABASE_URL')

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid absolute URL')
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must use http or https')
  }

  if (parsed.username || parsed.password) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must not contain credentials')
  }

  return parsed.origin
}

export function parsePublicRuntimeConfig(
  source: PublicRuntimeConfigSource
): PublicRuntimeConfig {
  return {
    supabaseUrl: normalizeSupabaseUrl(source.supabaseUrl),
    supabaseAnonKey: requireRuntimeValue(
      source.supabaseAnonKey,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ),
  }
}

export function getPublicRuntimeConfig(): PublicRuntimeConfig {
  return parsePublicRuntimeConfig({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
}
