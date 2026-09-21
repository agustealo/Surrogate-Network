import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { createClient } from '@supabase/supabase-js'

import { getPublicRuntimeConfig } from '@/infrastructure/config/runtimeConfig'
import { probeSupabaseReadiness } from '@/infrastructure/health/readiness'

describe('runtime readiness security boundary', () => {
  it('proves the live anonymous Supabase data plane without service-role authority', async () => {
    const config = getPublicRuntimeConfig()
    const anonymous = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const publicProfiles = await anonymous.from('public_profiles').select('id').limit(1)
    expect(publicProfiles.error).toBeNull()

    const concretePairProbe = await anonymous.rpc('are_users_blocked', {
      p_user_a: randomUUID(),
      p_user_b: randomUUID(),
    })
    expect(concretePairProbe.error).toBeTruthy()

    const result = await probeSupabaseReadiness(config, 5_000)
    expect(result.ok).toBe(true)
  })

  it('keeps privileged credentials out of the public readiness route', () => {
    const route = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/health/ready/route.ts'),
      'utf8'
    )
    const probe = fs.readFileSync(
      path.join(process.cwd(), 'src/infrastructure/health/readiness.ts'),
      'utf8'
    )
    const source = `${route}\n${probe}`

    expect(source).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
    expect(source).not.toContain('createServiceClient')
    expect(source).toContain("from('public_profiles')")
  })
})
