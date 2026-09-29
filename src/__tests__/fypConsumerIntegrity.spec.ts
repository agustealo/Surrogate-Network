import { readFileSync } from 'node:fs'
import path from 'node:path'

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('FYP consumer-integrity wiring', () => {
  it('combines bounded recent and explicit-intent candidate pools before ranking', () => {
    const service = source('src/application/services/FypRecommendationService.ts')

    expect(service).toContain('FYP_RECENT_POOL_LIMIT')
    expect(service).toContain('FYP_INTENT_POOL_LIMIT')
    expect(service).toContain('preferredNeedCategories(viewer)')
    expect(service).toContain('preferredOfferCategories(viewer)')
    expect(service).toContain('mergeCandidatePools(')
    expect(service).not.toContain('const CANDIDATE_WINDOW = 100')
  })

  it('balances the bounded intent pool across each explicit preferred category', () => {
    const service = source('src/application/services/FypRecommendationService.ts')
    const retrieval = source('src/domain/recommendations/retrieval.ts')

    expect(service).toContain('intentPoolLimitPerCategory(categories.length)')
    expect(service).toContain('categories.map(async (category) =>')
    expect(service).toContain(".eq('category', category)")
    expect(service).toContain('.limit(perCategoryLimit)')
    expect(service).toContain('.slice(0, FYP_INTENT_POOL_LIMIT)')
    expect(retrieval).toContain('Math.floor(FYP_INTENT_POOL_LIMIT / categoryCount)')
  })

  it('does not invent a viewer location-mode preference in the recommendation service', () => {
    const service = source('src/application/services/FypRecommendationService.ts')
    const scoring = source('src/domain/recommendations/scoring.ts')

    expect(service).not.toContain("locationMode: 'either'")
    expect(scoring).toContain('locationMode?: LocationMode')
    expect(scoring).toContain('if (!left || !right) return 0.5')
    expect(scoring).toContain('profile.locationMode && location >= 1')
  })
})
