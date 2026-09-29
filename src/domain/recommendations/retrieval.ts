import type { ViewerIntent } from '@/domain/recommendations/scoring'
import type { SurrogateCategory } from '@/domain/types'

export const FYP_RECENT_POOL_LIMIT = 100 as const
export const FYP_INTENT_POOL_LIMIT = 100 as const

function uniqueCategories(categories: SurrogateCategory[]): SurrogateCategory[] {
  return [...new Set(categories)]
}

export function preferredNeedCategories(viewer: ViewerIntent): SurrogateCategory[] {
  return uniqueCategories(viewer.offers.map((offer) => offer.category))
}

export function preferredOfferCategories(viewer: ViewerIntent): SurrogateCategory[] {
  return uniqueCategories(viewer.needs.map((need) => need.category))
}

export function intentPoolLimitPerCategory(categoryCount: number): number {
  if (categoryCount <= 0) return 0
  return Math.max(1, Math.floor(FYP_INTENT_POOL_LIMIT / categoryCount))
}

export function mergeCandidatePools<T extends { id: string }>(...pools: T[][]): T[] {
  const merged = new Map<string, T>()
  for (const pool of pools) {
    for (const candidate of pool) {
      if (!merged.has(candidate.id)) merged.set(candidate.id, candidate)
    }
  }
  return [...merged.values()]
}
