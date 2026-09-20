import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from '@jest/globals'

const actionDirectory = join(process.cwd(), 'src/application/actions')
const proposalAdapter = join(
  process.cwd(),
  'src/infrastructure/supabase/repositories/SupabaseProposalRepository.ts',
)

function actionSources(): Array<{ path: string; source: string }> {
  return readdirSync(actionDirectory)
    .filter((name) => name.endsWith('.ts'))
    .map((name) => {
      const path = join(actionDirectory, name)
      return { path, source: readFileSync(path, 'utf8') }
    })
}

describe('privilege source boundary', () => {
  it('keeps service-role clients out of human action modules', () => {
    for (const file of actionSources()) {
      expect(file.source).not.toContain('createServiceClient')
    }
  })

  it('keeps caller-supplied actor identities out of human mutation RPC calls', () => {
    const sources = [
      ...actionSources(),
      { path: proposalAdapter, source: readFileSync(proposalAdapter, 'utf8') },
    ]

    for (const file of sources) {
      expect(file.source).not.toMatch(/\bp_actor_id\s*:/)
      expect(file.source).not.toMatch(/\bp_admin_id\s*:/)
    }
  })

  it('keeps the proposal adapter session-scoped', () => {
    const source = readFileSync(proposalAdapter, 'utf8')
    expect(source).not.toContain('createServiceClient')
    expect(source).toContain('createClient')
  })
})
