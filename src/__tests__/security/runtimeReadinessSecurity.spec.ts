import fs from 'node:fs'
import path from 'node:path'

import { getPublicRuntimeConfig } from '@/infrastructure/config/runtimeConfig'
import { probeSupabaseReadiness } from '@/infrastructure/health/readiness'

describe('runtime readiness security boundary', () => {
  it('proves the live anonymous Supabase data plane without service-role authority', async () => {
    const result = await probeSupabaseReadiness(getPublicRuntimeConfig(), 5_000)
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
