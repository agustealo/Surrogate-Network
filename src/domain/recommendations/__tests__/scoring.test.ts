import { FYP_RANKING_VERSION, rankNeedsForViewer, rankOffersForViewer, type ViewerIntent } from '@/domain/recommendations/scoring'

const viewer: ViewerIntent = {
  profile: {
    userId: 'viewer',
    boundaries: ['platonic', 'virtual'],
    locationMode: 'either',
    availability: 'weekday evenings',
  },
  needs: [
    {
      id: 'viewer-need',
      userId: 'viewer',
      category: 'personal',
      tags: ['conversation'],
      locationMode: 'remote',
      timing: 'weekday evenings',
      boundaries: ['platonic', 'virtual'],
      createdAt: '2026-09-28T12:00:00.000Z',
    },
  ],
  offers: [
    {
      id: 'viewer-offer',
      userId: 'viewer',
      category: 'personal',
      locationMode: 'remote',
      timing: 'weekday evenings',
      boundaries: ['platonic', 'virtual'],
      createdAt: '2026-09-28T12:00:00.000Z',
    },
  ],
}

const now = new Date('2026-09-29T12:00:00.000Z')

describe('FYP_BASELINE_V1', () => {
  it('ranks a structurally compatible Need above an incompatible Need', () => {
    const ranked = rankNeedsForViewer(
      viewer,
      [
        {
          id: 'poor',
          userId: 'member-b',
          category: 'utilitarian_business',
          tags: [],
          locationMode: 'local',
          timing: 'weekend mornings',
          boundaries: ['physical'],
          urgency: 'low',
          createdAt: '2026-09-29T11:00:00.000Z',
        },
        {
          id: 'good',
          userId: 'member-a',
          category: 'personal',
          tags: ['conversation'],
          locationMode: 'remote',
          timing: 'weekday evenings',
          boundaries: ['platonic', 'virtual'],
          urgency: 'medium',
          createdAt: '2026-09-28T12:00:00.000Z',
        },
      ],
      now,
    )

    expect(ranked[0].item.id).toBe('good')
    expect(ranked[0].recommendation.rankingVersion).toBe(FYP_RANKING_VERSION)
    expect(ranked[0].recommendation.reasons.some((item) => item.code === 'BOUNDARY_MATCH')).toBe(true)
  })

  it('never recommends the viewer own listing', () => {
    const ranked = rankOffersForViewer(
      viewer,
      [
        {
          id: 'own',
          userId: 'viewer',
          category: 'personal',
          locationMode: 'remote',
          boundaries: ['platonic'],
          createdAt: '2026-09-29T11:00:00.000Z',
        },
        {
          id: 'other',
          userId: 'member-a',
          category: 'personal',
          locationMode: 'remote',
          boundaries: ['platonic'],
          createdAt: '2026-09-29T10:00:00.000Z',
        },
      ],
      now,
    )

    expect(ranked.map(({ item }) => item.id)).toEqual(['other'])
  })

  it('does not let a single owner monopolize the leading feed positions', () => {
    const ranked = rankNeedsForViewer(
      viewer,
      [
        {
          id: 'a1',
          userId: 'member-a',
          category: 'personal',
          tags: [],
          locationMode: 'remote',
          boundaries: ['platonic', 'virtual'],
          createdAt: '2026-09-29T11:55:00.000Z',
        },
        {
          id: 'a2',
          userId: 'member-a',
          category: 'personal',
          tags: [],
          locationMode: 'remote',
          boundaries: ['platonic', 'virtual'],
          createdAt: '2026-09-29T11:50:00.000Z',
        },
        {
          id: 'b1',
          userId: 'member-b',
          category: 'personal',
          tags: [],
          locationMode: 'remote',
          boundaries: ['platonic', 'virtual'],
          createdAt: '2026-09-29T11:45:00.000Z',
        },
      ],
      now,
    )

    expect(ranked.slice(0, 2).map(({ item }) => item.userId)).toEqual(['member-a', 'member-b'])
  })

  it('uses profile intent when the viewer has no active marketplace listings', () => {
    const coldViewer: ViewerIntent = { ...viewer, needs: [], offers: [] }
    const ranked = rankOffersForViewer(
      coldViewer,
      [
        {
          id: 'aligned',
          userId: 'member-a',
          category: 'casual',
          locationMode: 'remote',
          timing: 'weekday evenings',
          boundaries: ['platonic'],
          createdAt: '2026-09-28T12:00:00.000Z',
        },
        {
          id: 'unaligned',
          userId: 'member-b',
          category: 'casual',
          locationMode: 'remote',
          timing: 'weekend mornings',
          boundaries: ['physical'],
          createdAt: '2026-09-28T12:00:00.000Z',
        },
      ],
      now,
    )

    expect(ranked[0].item.id).toBe('aligned')
    expect(ranked[0].recommendation.reasons.some((item) => item.code === 'PROFILE_BOUNDARY_MATCH')).toBe(true)
  })
})
