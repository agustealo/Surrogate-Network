import {
  FYP_INTENT_POOL_LIMIT,
  FYP_RECENT_POOL_LIMIT,
  intentPoolLimitPerCategory,
  mergeCandidatePools,
  preferredNeedCategories,
  preferredOfferCategories,
} from '@/domain/recommendations/retrieval'
import {
  rankNeedsForViewer,
  rankOffersForViewer,
  type NeedIntent,
  type OfferIntent,
  type ViewerIntent,
} from '@/domain/recommendations/scoring'

const now = new Date('2026-10-21T12:00:00.000Z')
const oldCreatedAt = '2025-01-01T12:00:00.000Z'
const recentCreatedAt = '2026-10-21T11:00:00.000Z'

function need(id: string, overrides: Partial<NeedIntent> = {}): NeedIntent {
  return {
    id, userId: `need-owner-${id}`, category: 'personal', tags: [],
    locationMode: 'remote', boundaries: ['platonic'], createdAt: recentCreatedAt,
    ...overrides,
  }
}

function offer(id: string, overrides: Partial<OfferIntent> = {}): OfferIntent {
  return {
    id, userId: `offer-owner-${id}`, category: 'personal',
    locationMode: 'remote', boundaries: ['platonic'], createdAt: recentCreatedAt,
    ...overrides,
  }
}

const viewer: ViewerIntent = {
  profile: { userId: 'viewer', boundaries: ['platonic'] },
  needs: [need('my-need', { userId: 'viewer', category: 'utilitarian_business' })],
  offers: [offer('my-offer', { userId: 'viewer', category: 'personal' })],
}

describe('FYP real consumer-integrity behavior', () => {
  it('recovers a compatible older listing beyond the global recency pool through category intent', () => {
    const newest = Array.from({ length: FYP_RECENT_POOL_LIMIT }, (_, index) =>
      need(`recent-${index}`, { category: 'casual' }),
    )
    const olderCompatible = need('older-compatible', { createdAt: oldCreatedAt, category: 'personal' })
    const candidates = mergeCandidatePools(newest, [olderCompatible])
    const ranked = rankNeedsForViewer(viewer, candidates, now)
    expect(candidates).toHaveLength(FYP_RECENT_POOL_LIMIT + 1)
    expect(ranked.some((candidate) => candidate.item.id === olderCompatible.id)).toBe(true)
    expect(ranked[0].item.id).toBe(olderCompatible.id)
  })

  it('retains cold-start recency candidates without an explicit listing intent', () => {
    const newcomer: ViewerIntent = { profile: { userId: 'new-member', boundaries: [] }, needs: [], offers: [] }
    expect(preferredNeedCategories(newcomer)).toEqual([])
    expect(preferredOfferCategories(newcomer)).toEqual([])
    const recent = [need('first'), need('second')]
    expect(rankNeedsForViewer(newcomer, mergeCandidatePools(recent), now)).toHaveLength(2)
  })

  it('derives opposite-side category intent and deduplicates overlapping pools in order', () => {
    expect(preferredNeedCategories(viewer)).toEqual(['personal'])
    expect(preferredOfferCategories(viewer)).toEqual(['utilitarian_business'])
    const recent = [need('repeat'), need('recent')]
    const intent = [need('repeat', { createdAt: oldCreatedAt }), need('older', { createdAt: oldCreatedAt })]
    const merged = mergeCandidatePools(recent, intent)
    expect(merged.map((candidate) => candidate.id)).toEqual(['repeat', 'recent', 'older'])
    expect(merged[0]).toBe(recent[0])
  })

  it('keeps intent quota bounded when categories multiply', () => {
    expect(intentPoolLimitPerCategory(0)).toBe(0)
    for (let categoryCount = 1; categoryCount <= 3; categoryCount += 1) {
      expect(categoryCount * intentPoolLimitPerCategory(categoryCount)).toBeLessThanOrEqual(FYP_INTENT_POOL_LIMIT)
    }
  })

  it('does not claim location matches when the viewer has given no location preference', () => {
    const newcomer: ViewerIntent = { profile: { userId: 'viewer', boundaries: [] }, needs: [], offers: [] }
    const rankedNeeds = rankNeedsForViewer(newcomer, [need('local', { locationMode: 'local' })], now)
    const rankedOffers = rankOffersForViewer(newcomer, [offer('remote', { locationMode: 'remote' })], now)
    for (const candidate of [...rankedNeeds, ...rankedOffers]) {
      expect(candidate.recommendation.reasons.some((reason) => reason.code === 'LOCATION_MATCH')).toBe(false)
    }
  })

  it.each(['remote', 'local', 'either'] as const)(
    'emits a truthful location-match reason for an explicit %s preference',
    (locationMode) => {
      const explicit: ViewerIntent = {
        profile: { userId: 'viewer', boundaries: [], locationMode },
        needs: [], offers: [],
      }
      const ranked = rankNeedsForViewer(explicit, [need('match', { locationMode })], now)
      expect(ranked[0].recommendation.reasons.some((reason) => reason.code === 'LOCATION_MATCH')).toBe(true)
    },
  )
})
