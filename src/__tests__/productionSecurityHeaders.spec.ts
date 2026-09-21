import { buildContentSecurityPolicy, buildSecurityHeaders } from '@/infrastructure/security/securityHeaders'

describe('production security headers', () => {
  it('scopes Supabase connectivity to the configured project origin', () => {
    const policy = buildContentSecurityPolicy('https://project-ref.supabase.co/path')

    expect(policy).toContain("connect-src 'self' https://project-ref.supabase.co wss://project-ref.supabase.co")
    expect(policy).toContain("img-src 'self' data: blob: https://project-ref.supabase.co")
    expect(policy).not.toContain('*.supabase.co')
    expect(policy).not.toContain('127.0.0.1')
  })

  it('permits localhost only when localhost is the configured Supabase origin', () => {
    const policy = buildContentSecurityPolicy('http://127.0.0.1:54321')

    expect(policy).toContain('http://127.0.0.1:54321')
    expect(policy).toContain('ws://127.0.0.1:54321')
    expect(policy).not.toContain('https://*.supabase.co')
  })

  it('adds HSTS only to production responses', () => {
    const production = buildSecurityHeaders({
      nodeEnv: 'production',
      supabaseUrl: 'https://project-ref.supabase.co',
    })
    const development = buildSecurityHeaders({
      nodeEnv: 'development',
      supabaseUrl: 'http://127.0.0.1:54321',
    })

    expect(production).toContainEqual({
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000',
    })
    expect(development.some((header) => header.key === 'Strict-Transport-Security')).toBe(false)
  })

  it('rejects malformed or non-http Supabase URLs', () => {
    expect(() => buildContentSecurityPolicy('not-a-url')).toThrow('valid absolute URL')
    expect(() => buildContentSecurityPolicy('ftp://example.com')).toThrow('must use http or https')
  })
})
