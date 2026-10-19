import { readFileSync } from 'node:fs'
import path from 'node:path'

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('FYP recommendation preference management', () => {
  it('keeps saved and hidden state durable while only impression suppression decays', () => {
    const events = source('src/application/services/RecommendationEventService.ts')

    expect(events).toContain("restoreInterest: 'fyp.restore_interest'")
    const historyStart = events.indexOf('async historyFor(')
    const historyEnd = events.indexOf('async resolveSafetyExposureForMember', historyStart)
    const history = events.slice(historyStart, historyEnd)

    expect(history).toContain(".from('recommendation_preferences')")
    expect(history).toContain("preference.preference === 'saved'")
    expect(history).toContain("preference.preference === 'hidden'")
    expect(history).not.toContain('const historyStart = new Date(now.getTime() - 90')
    expect(history).toContain("const recentStart = new Date(now.getTime() - 7 * 86_400_000)")
    expect(history).toContain(".eq('action', FYP_EVENT_ACTIONS.impression)")
  })

  it('permits only an active member to restore their own recommendation interest', () => {
    const migration = source('supabase/migrations/20261003000100_recommendation_restore_interest_policy.sql')

    expect(migration).toContain('actor_id = auth.uid()')
    expect(migration).toContain('public.is_active_member(actor_id)')
    expect(migration).toContain("action = 'fyp.restore_interest'")
    expect(migration).toContain("target_type IN ('need', 'offer')")
    expect(migration).toContain('target_id IS NOT NULL')
  })

  it('surfaces saved and hidden management from Discover', () => {
    const routes = source('src/lib/routes.ts')
    const discover = source('src/app/(member)/discover/page.tsx')
    const page = source('src/app/(member)/discover/preferences/page.tsx')
    const controls = source('src/components/recommendations/RecommendationPreferenceItemControls.tsx')

    expect(routes).toContain("recommendationPreferences: '/discover/preferences'")
    expect(discover).toContain('routes.member.recommendationPreferences')
    expect(discover).toContain('Saved & hidden')
    expect(page).toContain('Recommendation preferences')
    expect(controls).toContain('Remove saved')
    expect(controls).toContain('Show again')
  })

  it('allows stale preference state to be cleared even when the listing is unavailable', () => {
    const service = source('src/application/services/RecommendationPreferenceService.ts')
    const page = source('src/app/(member)/discover/preferences/page.tsx')

    expect(service).toContain("title: row?.title ?? null")
    expect(service).toContain("available: row?.status === 'active'")
    expect(page).toContain("This recommendation is no longer available, but you can still clear its saved or hidden state.")
    expect(page).toContain('<RecommendationPreferenceItemControls')
  })

  it('revalidates both the feed and preference-management surface after preference changes', () => {
    const actions = source('src/application/actions/recommendationActions.ts')

    expect(actions).toContain("'restore_interest'")
    expect(actions).toContain("revalidatePath('/discover')")
    expect(actions).toContain("revalidatePath('/discover/preferences')")
  })
})
