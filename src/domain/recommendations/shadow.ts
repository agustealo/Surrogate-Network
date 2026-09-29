import type { RecommendationCandidate } from '@/domain/recommendations/scoring'

export const FYP_SHADOW_RANKING_VERSION = 'FYP_SHADOW_EXPLORATION_V1' as const

export type ShadowSubjectType = 'need' | 'offer'

export type ShadowRankingItem<T> = RecommendationCandidate<T> & {
  shadowScore: number
  baselinePosition: number
  shadowPosition: number
  recentImpressionCount: number
}

export type ShadowComparison = {
  rankingVersion: typeof FYP_SHADOW_RANKING_VERSION
  subjectType: ShadowSubjectType
  subjectId: string
  baselinePosition: number | null
  shadowPosition: number
  baselineScore: number | null
  shadowScore: number
  rankDelta: number | null
}

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value * 100) / 100))

function stableExplorationBonus(seed: string): number {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return ((hash >>> 0) % 301) / 100
}

export function buildShadowRanking<T extends { id: string }>(input: {
  actorId: string
  sessionId: string
  ranked: RecommendationCandidate<T>[]
  recentImpressionCountFor: (subjectId: string) => number
}): ShadowRankingItem<T>[] {
  const baselinePositions = new Map(input.ranked.map((candidate, index) => [candidate.item.id, index + 1]))

  return input.ranked
    .map((candidate) => {
      const recentImpressionCount = input.recentImpressionCountFor(candidate.item.id)
      const exposurePenalty = Math.min(3, Math.max(0, recentImpressionCount)) * 3
      const explorationBonus = stableExplorationBonus(`${input.actorId}:${input.sessionId}:${candidate.item.id}`)
      const shadowScore = clampScore(candidate.recommendation.score - exposurePenalty + explorationBonus)

      return {
        ...candidate,
        shadowScore,
        baselinePosition: baselinePositions.get(candidate.item.id) ?? Number.MAX_SAFE_INTEGER,
        shadowPosition: 0,
        recentImpressionCount,
      }
    })
    .sort((left, right) =>
      right.shadowScore - left.shadowScore
      || left.baselinePosition - right.baselinePosition
      || left.item.id.localeCompare(right.item.id),
    )
    .map((candidate, index) => ({ ...candidate, shadowPosition: index + 1 }))
}

export function compareShadowRanking<T extends { id: string }>(input: {
  subjectType: ShadowSubjectType
  baseline: RecommendationCandidate<T>[]
  shadow: ShadowRankingItem<T>[]
  limit?: number
}): ShadowComparison[] {
  const limit = input.limit ?? 24
  const baselineById = new Map(input.baseline.map((candidate, index) => [candidate.item.id, {
    position: index + 1,
    score: candidate.recommendation.score,
  }]))

  return input.shadow.slice(0, limit).map((candidate) => {
    const baseline = baselineById.get(candidate.item.id)
    return {
      rankingVersion: FYP_SHADOW_RANKING_VERSION,
      subjectType: input.subjectType,
      subjectId: candidate.item.id,
      baselinePosition: baseline?.position ?? null,
      shadowPosition: candidate.shadowPosition,
      baselineScore: baseline?.score ?? null,
      shadowScore: candidate.shadowScore,
      rankDelta: baseline ? baseline.position - candidate.shadowPosition : null,
    }
  })
}

export type ShadowEvaluationSummary = {
  shadowCount: number
  baselineCount: number
  overlapCount: number
  overlapRate: number
  meanAbsoluteRankDelta: number
  promotedCount: number
  demotedCount: number
  unchangedCount: number
}

export function summarizeShadowComparison(input: {
  baselineSubjectIds: string[]
  comparisons: ShadowComparison[]
}): ShadowEvaluationSummary {
  const baselineSet = new Set(input.baselineSubjectIds)
  const overlapping = input.comparisons.filter((comparison) => baselineSet.has(comparison.subjectId) && comparison.rankDelta !== null)
  const absoluteRankDelta = overlapping.reduce((sum, comparison) => sum + Math.abs(comparison.rankDelta ?? 0), 0)

  return {
    shadowCount: input.comparisons.length,
    baselineCount: input.baselineSubjectIds.length,
    overlapCount: overlapping.length,
    overlapRate: input.comparisons.length ? Math.round((overlapping.length / input.comparisons.length) * 10_000) / 10_000 : 0,
    meanAbsoluteRankDelta: overlapping.length ? Math.round((absoluteRankDelta / overlapping.length) * 10_000) / 10_000 : 0,
    promotedCount: overlapping.filter((comparison) => (comparison.rankDelta ?? 0) > 0).length,
    demotedCount: overlapping.filter((comparison) => (comparison.rankDelta ?? 0) < 0).length,
    unchangedCount: overlapping.filter((comparison) => comparison.rankDelta === 0).length,
  }
}
