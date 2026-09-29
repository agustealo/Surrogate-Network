import { FYP_RANKING_VERSION, type RecommendationCandidate } from '@/domain/recommendations/scoring'
import {
  FYP_SHADOW_RANKING_VERSION,
  buildShadowRanking,
  compareShadowRanking,
  summarizeShadowComparison,
} from '@/domain/recommendations/shadow'

type Item = { id: string }

const candidate = (id: string, score: number): RecommendationCandidate<Item> => ({
  item: { id },
  recommendation: {
    score,
    confidence: 80,
    reasons: [],
    rankingVersion: FYP_RANKING_VERSION,
  },
})

describe('FYP shadow ranking', () => {
  const baseline = [
    candidate('alpha', 90),
    candidate('bravo', 88),
    candidate('charlie', 86),
    candidate('delta', 84),
  ]

  it('does not mutate the certified baseline order or scores', () => {
    const snapshot = JSON.parse(JSON.stringify(baseline))
    buildShadowRanking({
      actorId: 'viewer-1',
      sessionId: 'baseline-session:shadow',
      ranked: baseline,
      recentImpressionCountFor: (id) => id === 'alpha' ? 3 : 0,
    })

    expect(baseline).toEqual(snapshot)
    expect(baseline.map((entry) => entry.item.id)).toEqual(['alpha', 'bravo', 'charlie', 'delta'])
  })

  it('penalizes repeated exposure while keeping the candidate deterministic', () => {
    const first = buildShadowRanking({
      actorId: 'viewer-1',
      sessionId: 'baseline-session:shadow',
      ranked: baseline,
      recentImpressionCountFor: (id) => id === 'alpha' ? 3 : 0,
    })
    const second = buildShadowRanking({
      actorId: 'viewer-1',
      sessionId: 'baseline-session:shadow',
      ranked: baseline,
      recentImpressionCountFor: (id) => id === 'alpha' ? 3 : 0,
    })

    expect(first).toEqual(second)
    expect(first[0].item.id).not.toBe('alpha')
    expect(first.find((entry) => entry.item.id === 'alpha')?.recentImpressionCount).toBe(3)
  })

  it('records rank deltas against the baseline without claiming consumer impressions', () => {
    const shadow = buildShadowRanking({
      actorId: 'viewer-1',
      sessionId: 'baseline-session:shadow',
      ranked: baseline,
      recentImpressionCountFor: (id) => id === 'alpha' ? 3 : 0,
    })
    const comparisons = compareShadowRanking({
      subjectType: 'offer',
      baseline,
      shadow,
      limit: 3,
    })

    expect(comparisons).toHaveLength(3)
    expect(comparisons.every((entry) => entry.rankingVersion === FYP_SHADOW_RANKING_VERSION)).toBe(true)
    expect(comparisons.some((entry) => entry.rankDelta !== 0)).toBe(true)
  })

  it('summarizes overlap and movement for offline evaluation', () => {
    const shadow = buildShadowRanking({
      actorId: 'viewer-1',
      sessionId: 'baseline-session:shadow',
      ranked: baseline,
      recentImpressionCountFor: (id) => id === 'alpha' ? 3 : 0,
    })
    const comparisons = compareShadowRanking({
      subjectType: 'need',
      baseline,
      shadow,
      limit: 4,
    })
    const summary = summarizeShadowComparison({
      baselineSubjectIds: baseline.map((entry) => entry.item.id),
      comparisons,
    })

    expect(summary.shadowCount).toBe(4)
    expect(summary.baselineCount).toBe(4)
    expect(summary.overlapRate).toBe(1)
    expect(summary.promotedCount + summary.demotedCount + summary.unchangedCount).toBe(4)
    expect(summary.meanAbsoluteRankDelta).toBeGreaterThan(0)
  })
})
