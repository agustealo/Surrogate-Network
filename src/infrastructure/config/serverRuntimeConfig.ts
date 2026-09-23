import 'server-only'

import { getPublicRuntimeConfig, type PublicRuntimeConfig } from './runtimeConfig'

export type ServerRuntimeConfig = PublicRuntimeConfig & {
  supabaseServiceRoleKey: string
}

export function getServerRuntimeConfig(): ServerRuntimeConfig {
  const publicConfig = getPublicRuntimeConfig()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!serviceRoleKey) {
    throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY')
  }

  return {
    ...publicConfig,
    supabaseServiceRoleKey: serviceRoleKey,
  }
}
