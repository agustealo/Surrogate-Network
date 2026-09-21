import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { PublicRuntimeConfig } from '@/infrastructure/config/runtimeConfig'
import type { Database } from '@/infrastructure/supabase/database.types'

export type SupabaseReadinessResult = {
  ok: boolean
  timedOut: boolean
}

function createTimeoutFetch(timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      return await fetch(input, {
        ...init,
        cache: 'no-store',
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }
  }
}

export async function probeSupabaseReadiness(
  config: PublicRuntimeConfig,
  timeoutMs = 3_000
): Promise<SupabaseReadinessResult> {
  const client = createSupabaseClient<Database>(
    config.supabaseUrl,
    config.supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: createTimeoutFetch(timeoutMs),
      },
    }
  )

  try {
    const { error } = await client.from('public_profiles').select('id').limit(1)
    return {
      ok: error === null,
      timedOut: false,
    }
  } catch (error) {
    return {
      ok: false,
      timedOut: error instanceof Error && error.name === 'AbortError',
    }
  }
}
