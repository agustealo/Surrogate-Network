import { expect, test } from '@playwright/test'

test.describe('Runtime health @smoke', () => {
  test('distinguishes process liveness from dependency readiness', async ({ request }) => {
    const live = await request.get('/api/health/live')
    expect(live.status()).toBe(200)
    expect(live.headers()['cache-control']).toContain('no-store')
    expect(live.headers()['x-request-id']).toBeTruthy()
    await expect(live.json()).resolves.toEqual({ status: 'alive' })

    const ready = await request.get('/api/health/ready')
    expect(ready.status()).toBe(200)
    expect(ready.headers()['cache-control']).toContain('no-store')
    expect(ready.headers()['x-request-id']).toBeTruthy()
    await expect(ready.json()).resolves.toEqual({
      status: 'ready',
      checks: {
        runtimeConfig: 'ok',
        supabase: 'ok',
      },
    })
  })
})
