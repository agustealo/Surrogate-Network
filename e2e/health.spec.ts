import { expect, test } from '@playwright/test'

const RELEASE_REVISION = /^[0-9a-f]{7,64}$/

test.describe('Runtime health @smoke', () => {
  test('distinguishes process liveness from dependency readiness', async ({ request }) => {
    const live = await request.get('/api/health/live')
    expect(live.status()).toBe(200)
    expect(live.headers()['cache-control']).toContain('no-store')
    expect(live.headers()['x-request-id']).toBeTruthy()

    const liveBody = await live.json()
    expect(liveBody).toMatchObject({ status: 'alive' })
    expect(liveBody.revision).toMatch(RELEASE_REVISION)

    const ready = await request.get('/api/health/ready')
    expect(ready.status()).toBe(200)
    expect(ready.headers()['cache-control']).toContain('no-store')
    expect(ready.headers()['x-request-id']).toBeTruthy()

    const readyBody = await ready.json()
    expect(readyBody).toMatchObject({
      status: 'ready',
      checks: {
        runtimeConfig: 'ok',
        supabase: 'ok',
      },
    })
    expect(readyBody.revision).toBe(liveBody.revision)
  })
})
