import { readFileSync } from 'node:fs'
import path from 'node:path'

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('FYP preference projection', () => {
  it('derives only active saved or hidden state from the latest append-only preference event', () => {
    const migration = source('supabase/migrations/20261007000100_fyp_preference_projection.sql')

    expect(migration).toContain('CREATE TABLE public.recommendation_preferences')
    expect(migration).toContain('SELECT DISTINCT ON (actor_id, target_type, target_id)')
    expect(migration).toContain("'fyp.save'")
    expect(migration).toContain("'fyp.unsave'")
    expect(migration).toContain("'fyp.not_interested'")
    expect(migration).toContain("'fyp.restore_interest'")
    expect(migration).toContain("WHERE action IN ('fyp.save', 'fyp.not_interested')")
  })

  it('maintains the projection transactionally from recommendation preference events', () => {
    const migration = source('supabase/migrations/20261007000100_fyp_preference_projection.sql')

    expect(migration).toContain('CREATE OR REPLACE FUNCTION private.project_fyp_recommendation_preference()')
    expect(migration).toContain("IF NEW.action = 'fyp.save'")
    expect(migration).toContain("ELSIF NEW.action = 'fyp.not_interested'")
    expect(migration).toContain("ELSIF NEW.action IN ('fyp.unsave', 'fyp.restore_interest')")
    expect(migration).toContain('DELETE FROM public.recommendation_preferences')
    expect(migration).toContain('audit_events_project_fyp_recommendation_preference')
  })

  it('keeps the projection read-only and actor-scoped for authenticated members', () => {
    const migration = source('supabase/migrations/20261007000100_fyp_preference_projection.sql')

    expect(migration).toContain('ALTER TABLE public.recommendation_preferences ENABLE ROW LEVEL SECURITY')
    expect(migration).toContain('REVOKE ALL ON TABLE public.recommendation_preferences FROM PUBLIC, anon, authenticated')
    expect(migration).toContain('GRANT SELECT ON TABLE public.recommendation_preferences TO authenticated')
    expect(migration).toContain('USING ((SELECT auth.uid()) = actor_id)')
  })

  it('reads current preference state from the bounded projection rather than replaying lifetime audit events', () => {
    const events = source('src/application/services/RecommendationEventService.ts')
    const historyStart = events.indexOf('async historyFor(')
    const historyEnd = events.indexOf('async resolveSafetyExposureForMember', historyStart)
    const history = events.slice(historyStart, historyEnd)

    expect(history).toContain(".from('recommendation_preferences')")
    expect(history).toContain(".eq('actor_id', actorId)")
    expect(history).toContain("const recentStart = new Date(now.getTime() - 7 * 86_400_000)")
    expect(history).toContain(".eq('action', FYP_EVENT_ACTIONS.impression)")
    expect(history).not.toContain('FYP_EVENT_ACTIONS.save')
    expect(history).not.toContain('FYP_EVENT_ACTIONS.unsave')
    expect(history).not.toContain('FYP_EVENT_ACTIONS.notInterested')
    expect(history).not.toContain('FYP_EVENT_ACTIONS.restoreInterest')
  })

  it('adds targeted indexes for latest preference and recent-impression access paths', () => {
    const migration = source('supabase/migrations/20261007000100_fyp_preference_projection.sql')

    expect(migration).toContain('idx_audit_events_fyp_preferences_latest')
    expect(migration).toContain('idx_audit_events_fyp_recent_impressions')
    expect(migration).toContain("WHERE action = 'fyp.impression'")
  })
})
