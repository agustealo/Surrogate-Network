import { createBrowserClient } from '@supabase/ssr'

import { getPublicRuntimeConfig } from '@/infrastructure/config/runtimeConfig'
import type { Database } from './database.types'

export function createClient() {
  const config = getPublicRuntimeConfig()

  return createBrowserClient<Database>(
    config.supabaseUrl,
    config.supabaseAnonKey
  )
}
