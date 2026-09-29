import { readFileSync } from 'node:fs'
import path from 'node:path'

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('FYP feed-session snapshot wiring', () => {
  it('persists bounded append-only Need and Offer lane snapshots with explicit expiry', () => {
    const snapshot = source('src/application/services/FypFeedSnapshotService.ts')

    expect(snapshot).toContain("FYP_FEED_SNAPSHOT_ACTION = 'fyp.feed_snapshot'")
    expect(snapshot).toContain('FYP_FEED_SESSION_TTL_MS = 4 * 60 * 60 * 1000')
    expect(snapshot).toContain('FYP_FEED_SNAPSHOT_LIMIT_PER_LANE = 100')
    expect(snapshot).toContain("target_type: 'fyp_feed_lane'")
    expect(snapshot).toContain('expiresAt')
    expect(snapshot).toContain('rankingVersion')
    expect(snapshot).toContain('items: serialize')
  })

  it('reuses only a non-expired snapshot for the currently authorized ranking version', () => {
    const snapshot = source('src/application/services/FypFeedSnapshotService.ts')
    const service = source('src/application/services/FypRecommendationService.ts')

    expect(snapshot).toContain('lane.rankingVersion === input.rankingVersion')
    expect(snapshot).toContain('new Date(lane.expiresAt).getTime() > input.now.getTime()')
    expect(service).toContain("experimentAssignment.cohort === 'candidate'")
    expect(service).toContain('snapshotService.current({')
    expect(service).toContain('rankingVersion: expectedRankingVersion')
  })

  it('uses the same session id for candidate ranking, persisted snapshot, shadow evidence, and UI events', () => {
    const service = source('src/application/services/FypRecommendationService.ts')
    const page = source('src/app/(member)/discover/page.tsx')

    expect(service).toContain('const sessionId = crypto.randomUUID()')
    expect(service).toContain('sessionId: `${sessionId}:${FYP_SHADOW_RANKING_VERSION}`')
    expect(service).toContain('sessionId,\n      rankingVersion: expectedRankingVersion')
    expect(service).toContain('sessionId,\n      baselineNeeds: allRankedNeeds')
    expect(page).toContain('sessionId={feed.sessionId}')
  })

  it('preserves frozen positions after live eligibility removes an item', () => {
    const service = source('src/application/services/FypRecommendationService.ts')
    const page = source('src/app/(member)/discover/page.tsx')

    expect(service).toContain('rankPosition: item.position')
    expect(service).toContain(".eq('status', 'active')")
    expect(service).toContain("!history.notInterested.has(recommendationSubjectKey(subjectType, subjectId))")
    expect(page).toContain('rankPosition: need.rankPosition')
    expect(page).toContain('rankPosition: offer.rankPosition')
    expect(page).toContain('rankPosition={need.rankPosition}')
    expect(page).toContain('rankPosition={offer.rankPosition}')
  })

  it('does not let repeat-exposure suppression mutate an already generated session', () => {
    const service = source('src/application/services/FypRecommendationService.ts')
    const snapshotEligibility = service.slice(service.indexOf('private isSnapshotEligible('), service.indexOf('private toNeedIntent('))

    expect(snapshotEligibility).toContain('notInterested')
    expect(snapshotEligibility).not.toContain('recentImpressionCounts')
    expect(snapshotEligibility).not.toContain('REPEAT_IMPRESSION_LIMIT')
  })
})
