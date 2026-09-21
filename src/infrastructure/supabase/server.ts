import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

import { getPublicRuntimeConfig } from '@/infrastructure/config/runtimeConfig'
import { getServerRuntimeConfig } from '@/infrastructure/config/serverRuntimeConfig'
import type { Database } from './database.types'

/**
 * Request-scoped Supabase client. This is the canonical server client for
 * authentication and all user-authorized data access. It preserves the
 * caller's session so Row Level Security remains authoritative.
 */
export async function createClient() {
  const cookieStore = await cookies()
  const config = getPublicRuntimeConfig()

  return createServerClient<Database>(
    config.supabaseUrl,
    config.supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Server Components cannot always mutate cookies. Middleware owns
            // session refresh and will persist refreshed cookies when required.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // See set() above.
          }
        },
      },
    }
  )
}

/**
 * Privileged server-only client. Never use this client to identify the current
 * user and never expose it to client components. It intentionally bypasses RLS
 * and is reserved for narrowly-scoped trusted administrative/system reads.
 */
export function createServiceClient() {
  const config = getServerRuntimeConfig()

  return createSupabaseClient<Database>(
    config.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  )
}
