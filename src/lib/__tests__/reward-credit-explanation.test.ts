import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('Reward-credit explanations remain aligned with the canonical nonmonetary policy', () => {
  const member = readFileSync(
    path.join(process.cwd(), 'src/app/(member)/rewards/page.tsx'), 'utf8',
  )
  const admin = readFileSync(
    path.join(process.cwd(), 'src/app/admin/achievements/page.tsx'), 'utf8',
  )

  it('does not attribute all uncredited Feedback solely to weekly limits', () => {
    expect(member).toContain('including weekly limits or reciprocal-cycle review')
    expect(member).toContain('You can always submit honest Feedback.')
    expect(member).toContain('A review signal is not a fraud verdict.')
    expect(member).not.toContain('not earned XP under the rolling participation limits')
  })

  it('identifies the actual cycle-review event in the admin audit', () => {
    expect(admin).toContain("event.reason === 'reciprocal_cycle_review'")
    expect(admin).toContain('Three-member reciprocal-cycle credit review')
    expect(admin).toContain('are nonpunitive signals, not findings of fraud')
  })
})
