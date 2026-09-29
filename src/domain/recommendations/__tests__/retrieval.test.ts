import {
  FYP_INTENT_POOL_LIMIT,
  intentPoolLimitPerCategory,
  mergeCandidatePools,
  preferredNeedCategories,
  preferredOfferCategories,
} from '@/domain/recommendations/retrieval'
import type { ViewerIntent } from '@/domain/recommendations/scoring'

const viewer = (overrides: Partial<ViewerIntent> = {}): ViewerIntent => ({
  profile: {
    userId: 'viewer',
    boundaries: [],
    availability: undefined,
  },
  needs: [],
  offers: [],
  ...overrides,
})

describe('FYP candidate retrieval policy', () => {
  it('derives Need retrieval categories from the viewer offers and removes duplicates', () => {
    const result = preferredNeedCategories(viewer({
      offers: [
        { id: 'o1', userId: 'viewer', category: 'personal', locationMode: 'remote', boundaries: [], createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 'o2', userId: 'viewer', category: 'personal', locationMode: 'local', boundaries: [], createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 'o3', userId: 'viewer', category: 'casual', locationMode: 'either', boundaries: [], createdAt: '2026-01-01T00:00:00.000Z' },
      ],
    }))

    expect(result).toEqual(['personal', 'casual'])
  })

  it('derives Offer retrieval categories from the viewer needs', () => {
    const result = preferredOfferCategories(viewer({
      needs: [
        { id: 'n1', userId: 'viewer', category: 'utilitarian_business', tags: [], locationMode: 'remote', boundaries: [], createdAt: '2026-01-01T00:00:00.000Z' },
      ],
    }))

    expect(result).toEqual(['utilitarian_business'])
  })

  it('splits the bounded intent budget fairly across preferred categories', () => {
    expect(intentPoolLimitPerCategory(0)).toBe(0)
    expect(intentPoolLimitPerCategory(1)).toBe(FYP_INTENT_POOL_LIMIT)
    expect(intentPoolLimitPerCategory(2)).toBe(50)
    expect(intentPoolLimitPerCategory(3)).toBe(33)
    expect(intentPoolLimitPerCategory(3) * 3).toBeLessThanOrEqual(FYP_INTENT_POOL_LIMIT)
  })

  it('deduplicates candidates while preserving retrieval priority', () => {
    const recent = [{ id: 'a', source: 'recent' }, { id: 'b', source: 'recent' }]
    const aligned = [{ id: 'b', source: 'aligned' }, { id: 'c', source: 'aligned' }]

    expect(mergeCandidatePools(recent, aligned)).toEqual([
      { id: 'a', source: 'recent' },
      { id: 'b', source: 'recent' },
      { id: 'c', source: 'aligned' },
    ])
  })
})
