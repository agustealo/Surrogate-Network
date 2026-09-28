import { execFileSync } from 'node:child_process'
import { chmodSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1'])
const outputPath = resolve(process.cwd(), '.env.local')

function parseSupabaseStatus(raw) {
  const values = new Map()

  for (const sourceLine of raw.split(/\r?\n/)) {
    const line = sourceLine.trim()
    if (!line || line.startsWith('#')) continue

    const separator = line.indexOf('=')
    if (separator <= 0) continue

    const key = line.slice(0, separator).trim()
    let value = line.slice(separator + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    values.set(key, value)
  }

  return values
}

function requireValue(values, name) {
  const value = values.get(name)?.trim()
  if (!value) throw new Error(`Local Supabase did not report ${name}`)
  return value
}

function assertLoopbackUrl(value, name) {
  let parsed
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${name} must be an absolute URL`)
  }

  if (!LOCAL_HOSTS.has(parsed.hostname)) {
    throw new Error(`${name} must point at the local Supabase runtime, received host ${parsed.hostname}`)
  }

  return value
}

function serializeValue(value) {
  return JSON.stringify(value)
}

function main() {
  let status
  try {
    status = execFileSync('supabase', ['status', '-o', 'env'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    const detail = error?.stderr?.toString().trim()
    throw new Error(
      detail
        ? `Unable to read local Supabase status: ${detail}`
        : 'Unable to read local Supabase status. Run `supabase start` first.'
    )
  }

  const values = parseSupabaseStatus(status)
  const apiUrl = assertLoopbackUrl(requireValue(values, 'API_URL'), 'API_URL')
  const anonKey = requireValue(values, 'ANON_KEY')
  const serviceRoleKey = requireValue(values, 'SERVICE_ROLE_KEY')
  const mailpitUrl = values.get('MAILPIT_URL')?.trim()

  if (mailpitUrl) assertLoopbackUrl(mailpitUrl, 'MAILPIT_URL')

  const lines = [
    '# Generated from the repository-owned local Supabase runtime.',
    '# Do not edit by hand. Regenerate with: npm run local:config',
    `NEXT_PUBLIC_SUPABASE_URL=${serializeValue(apiUrl)}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${serializeValue(anonKey)}`,
    `SUPABASE_SERVICE_ROLE_KEY=${serializeValue(serviceRoleKey)}`,
  ]

  if (mailpitUrl) lines.push(`MAILPIT_URL=${serializeValue(mailpitUrl)}`)

  writeFileSync(outputPath, `${lines.join('\n')}\n`, { encoding: 'utf8', mode: 0o600 })
  chmodSync(outputPath, 0o600)
  process.stdout.write('Wrote local Supabase runtime configuration to .env.local\n')
}

try {
  main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
}
