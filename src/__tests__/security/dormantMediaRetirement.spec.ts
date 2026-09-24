import { describe, expect, it } from '@jest/globals'

const retiredResources = [
  'media_assets',
  'media_access_requests',
  'media_access_grants',
] as const

describe('Dormant media subsystem retirement', () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  it.each(retiredResources)('does not expose retired PostgREST resource %s', async (resource) => {
    if (!url || !serviceRoleKey) throw new Error('Local Supabase credentials are required')

    const response = await fetch(`${url}/rest/v1/${resource}?select=id&limit=1`, {
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
      },
    })

    const payload = await response.json() as { code?: string; message?: string }
    expect(response.status).toBe(404)
    expect(payload.code).toBe('PGRST205')
    expect(payload.message).toContain(resource)
  })
})
