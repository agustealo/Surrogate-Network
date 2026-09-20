import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

function requirePublicEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export function createClient() {
  const supabaseUrl = requirePublicEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_URL',
  )
  const supabaseAnonKey = requirePublicEnv(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  )

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
