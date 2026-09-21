import { buildServerRequestErrorLog } from '@/infrastructure/observability/serverLogger'
import { resolveRequestId, stripQueryAndFragment } from '@/infrastructure/observability/requestCorrelation'

describe('observability boundary', () => {
  it('preserves a safe upstream request id and rejects log-injection candidates', () => {
    expect(resolveRequestId('req-12345678')).toBe('req-12345678')

    const generated = resolveRequestId('bad\nrequest-id')
    expect(generated).not.toBe('bad\nrequest-id')
    expect(generated).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('removes query strings and fragments before request paths reach logs', () => {
    expect(stripQueryAndFragment('/needs/123?token=secret#section')).toBe('/needs/123')
    expect(stripQueryAndFragment('/')).toBe('/')
  })

  it('keeps production request errors structured without raw secrets or messages', () => {
    const error = Object.assign(new Error('member@example.com secret-token'), { digest: 'digest-123' })
    const payload = buildServerRequestErrorLog(
      error,
      {
        method: 'POST',
        path: '/settings?token=secret-token',
        headers: {
          'x-request-id': 'req-12345678',
          authorization: 'Bearer top-secret',
        },
      },
      {
        routerKind: 'App Router',
        routePath: '/settings',
        routeType: 'action',
        renderSource: 'server-rendering',
        renderType: 'dynamic',
      },
      'production'
    )

    expect(payload.requestId).toBe('req-12345678')
    expect(payload.path).toBe('/settings')
    expect(payload.errorDigest).toBe('digest-123')
    expect(payload.errorFingerprint).toMatch(/^[0-9a-f]{8}$/)
    expect(payload).not.toHaveProperty('errorMessage')
    expect(payload).not.toHaveProperty('errorStack')
    expect(JSON.stringify(payload)).not.toContain('member@example.com')
    expect(JSON.stringify(payload)).not.toContain('secret-token')
    expect(JSON.stringify(payload)).not.toContain('top-secret')
  })

  it('keeps development diagnostics available outside production', () => {
    const error = new Error('development detail')
    const payload = buildServerRequestErrorLog(
      error,
      { method: 'GET', path: '/home', headers: {} },
      { routerKind: 'App Router', routePath: '/home', routeType: 'render' },
      'development'
    )

    expect(payload).toHaveProperty('errorMessage', 'development detail')
    expect(payload).toHaveProperty('errorStack')
  })
})
