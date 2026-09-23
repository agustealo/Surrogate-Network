import fs from 'node:fs'
import path from 'node:path'

const RUNTIME_CONSUMERS = [
  'next.config.ts',
  'src/infrastructure/security/securityHeaders.ts',
  'src/infrastructure/supabase/browser.ts',
  'src/infrastructure/supabase/middleware.ts',
  'src/infrastructure/supabase/server.ts',
  'src/infrastructure/health/readiness.ts',
  'src/app/api/health/live/route.ts',
  'src/app/api/health/ready/route.ts',
]

describe('runtime configuration ownership', () => {
  it('keeps Supabase environment reads inside canonical config modules', () => {
    for (const relativePath of RUNTIME_CONSUMERS) {
      const source = fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

      expect(source).not.toContain('process.env.NEXT_PUBLIC_SUPABASE_URL')
      expect(source).not.toContain('process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
      expect(source).not.toContain('process.env.SUPABASE_SERVICE_ROLE_KEY')
    }
  })

  it('keeps the service-role secret behind an explicit server-only module boundary', () => {
    const publicConfig = fs.readFileSync(
      path.join(process.cwd(), 'src/infrastructure/config/runtimeConfig.ts'),
      'utf8'
    )
    const serverConfig = fs.readFileSync(
      path.join(process.cwd(), 'src/infrastructure/config/serverRuntimeConfig.ts'),
      'utf8'
    )

    expect(publicConfig).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
    expect(serverConfig).toContain("import 'server-only'")
    expect(serverConfig).toContain('process.env.SUPABASE_SERVICE_ROLE_KEY')
  })

  it('requires complete server configuration before reporting deployment readiness', () => {
    const readinessRoute = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/health/ready/route.ts'),
      'utf8'
    )

    expect(readinessRoute).toContain('getServerRuntimeConfig')
    expect(readinessRoute).not.toContain('getPublicRuntimeConfig')
    expect(readinessRoute).not.toContain('createServiceClient')
  })
})
