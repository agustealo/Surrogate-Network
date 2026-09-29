import { rankOffersForViewer, type ViewerIntent } from '@/domain/recommendations/scoring'

const candidate = {
  id: 'offer-1',
  userId: 'member-a',
  category: 'casual' as const,
  locationMode: 'remote' as const,
  timing: 'weekday evenings',
  boundaries: ['platonic' as const],
  createdAt: '2026-09-28T12:00:00.000Z',
}

const now = new Date('2026-09-29T12:00:00.000Z')

describe('FYP profile location intent', () => {
  it('does not claim a location match when the viewer has not supplied a location-mode preference', () => {
    const viewer: ViewerIntent = {
      profile: {
        userId: 'viewer',
        boundaries: ['platonic'],
        availability: 'weekday evenings',
      },
      needs: [],
      offers: [],
    }

    const [ranked] = rankOffersForViewer(viewer, [candidate], now)

    expect(ranked.recommendation.reasons.some((reason) => reason.code === 'LOCATION_MATCH')).toBe(false)
  })

  it('continues to explain an actual explicit location match', () => {
    const viewer: ViewerIntent = {
      profile: {
        userId: 'viewer',
        boundaries: ['platonic'],
        locationMode: 'remote',
        availability: 'weekday evenings',
      },
      needs: [],
      offers: [],
    }

    const [ranked] = rankOffersForViewer(viewer, [candidate], now)

    expect(ranked.recommendation.reasons.some((reason) => reason.code === 'LOCATION_MATCH')).toBe(true)
  })
})
