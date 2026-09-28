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
    expect(config).toContain('[db.seed]\nenabled = false')
    expect(config).toContain('[storage]\nenabled = false')
    expect(config).toContain('[realtime]\nenabled = false')
    expect(config).toContain('[edge_runtime]\nenabled = false')
    expect(config).not.toContain('openai_api_key')
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
