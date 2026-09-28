import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const exists = (relativePath: string) => fs.existsSync(path.join(root, relativePath))

describe('consumer release contract', () => {
  it('does not ship synthetic product data or unfinished consumer routes', () => {
    expect(exists('supabase/seed.sql')).toBe(false)
    expect(exists('src/app/(member)/messages/page.tsx')).toBe(false)
    expect(exists('src/intelligence')).toBe(false)
  })

  it('keeps the local Supabase runtime minimal and deterministic', () => {
    const config = read('supabase/config.toml')
    expect(config).toContain('project_id = "Surrogate-Network"')
    expect(config).toContain('[db.seed]\nenabled = false')
    expect(config).toContain('[storage]\nenabled = false')
    expect(config).toContain('[realtime]\nenabled = false')
    expect(config).toContain('[edge_runtime]\nenabled = false')
    expect(config).not.toContain('openai_api_key')
  })

  it('keeps local Supabase network exposure loopback-only through the canonical launcher', () => {
    const packageJson = read('package.json')
    const launcher = read('scripts/start-local-supabase.mjs')
    expect(packageJson).toContain('node scripts/start-local-supabase.mjs')
    expect(launcher).toContain('com.docker.network.bridge.host_binding_ipv4=127.0.0.1')
    expect(launcher).toContain("['start', '--network-id', networkName]")
  })

  it('requires verified email ownership before consumer signup creates a usable session', () => {
    const config = read('supabase/config.toml')
    const confirmationRoute = read('src/app/auth/confirm/route.ts')
    const confirmationTemplate = read('supabase/templates/confirmation.html')
    const e2e = read('e2e/smoke.spec.ts')

    expect(config).toContain('enable_confirmations = true')
    expect(config).toContain('[auth.email.template.confirmation]')
    expect(confirmationRoute).toContain('verifyOtp')
    expect(confirmationRoute).toContain('token_hash')
    expect(confirmationTemplate).toContain('/auth/confirm?token_hash=')
    expect(e2e).toContain('confirmationLinkFor(member.email)')
  })

  it('retires dormant notifications and token economy without removing active XP progression', () => {
    const retirement = read('supabase/migrations/20260928000100_retire_dormant_notification_token_surface.sql')
    expect(retirement).toContain('DROP TABLE IF EXISTS public.notifications')
    expect(retirement).toContain('DROP TABLE IF EXISTS public.token_transactions')
    expect(retirement).toContain('DROP COLUMN IF EXISTS token_balance')
    expect(retirement).toContain('DROP FUNCTION IF EXISTS public.update_token_balance')
    expect(retirement).toContain('DELETE FROM public.xp_transactions')
    expect(retirement).toContain('DELETE FROM public.member_progression')
    expect(retirement).not.toContain('DROP TABLE IF EXISTS public.xp_transactions')
    expect(retirement).not.toContain('DROP TABLE IF EXISTS public.member_progression')
  })

  it('never compiles the release build with invented Supabase credentials', () => {
    const workflow = read('.github/workflows/ci.yml')
    expect(workflow).not.toContain('build-only-local-key')
    expect(workflow).not.toContain('build-only-local-service-key')
    expect(workflow).toContain('npm run local:config')
  })

  it('keeps generated local credentials outside version control', () => {
    const gitignore = read('.gitignore')
    expect(gitignore).toContain('.env*')
    expect(gitignore).toContain('!.env.example')

    const example = read('.env.example')
    expect(example).toContain('Local runtime contract only.')
    expect(example).not.toContain('hosted Supabase')
  })
})
