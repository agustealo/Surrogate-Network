import {
  normalizeSupabaseUrl,
  parsePublicRuntimeConfig,
} from '@/infrastructure/config/runtimeConfig'

describe('runtime configuration', () => {
  it('normalizes Supabase configuration to the canonical origin', () => {
    expect(
      parsePublicRuntimeConfig({
        supabaseUrl: 'https://project-ref.supabase.co/path?ignored=true',
        supabaseAnonKey: ' public-anon-key ',
      })
    ).toEqual({
      supabaseUrl: 'https://project-ref.supabase.co',
      supabaseAnonKey: 'public-anon-key',
    })
  })

  it('rejects missing required public configuration', () => {
    expect(() =>
      parsePublicRuntimeConfig({
        supabaseUrl: undefined,
        supabaseAnonKey: 'anon-key',
      })
    ).toThrow('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')

    expect(() =>
      parsePublicRuntimeConfig({
        supabaseUrl: 'https://project-ref.supabase.co',
        supabaseAnonKey: '   ',
      })
    ).toThrow('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  })

  it('rejects malformed, non-http, or credential-bearing Supabase URLs', () => {
    expect(() => normalizeSupabaseUrl('not-a-url')).toThrow('valid absolute URL')
    expect(() => normalizeSupabaseUrl('ftp://example.com')).toThrow('must use http or https')
    expect(() => normalizeSupabaseUrl('https://user:secret@example.com')).toThrow('must not contain credentials')
  })
})
