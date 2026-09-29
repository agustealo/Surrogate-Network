import type { Boundary, SurrogateCategory } from '@/domain/types'

export const FYP_RANKING_VERSION = 'FYP_BASELINE_V1' as const

export type LocationMode = 'remote' | 'local' | 'either'

export type RecommendationReason = {
  code:
    | 'BOUNDARY_MATCH'
    | 'LOCATION_MATCH'
    | 'CATEGORY_MATCH'
    | 'TIMING_MATCH'
    | 'FRESH_LISTING'
    | 'TRUST_SIGNAL'
    | 'URGENT_NEED'
    | 'AVAILABLE_CAPACITY'
    | 'PROFILE_BOUNDARY_MATCH'
  label: string
  contribution: number
}

export type RecommendationMeta = {
  score: number
  confidence: number
  reasons: RecommendationReason[]
  rankingVersion: string
}

export type ViewerProfileIntent = {
  userId: string
  boundaries: Boundary[]
  locationMode: LocationMode
  availability?: string
}

export type NeedIntent = {
  id: string
  userId: string
  category: SurrogateCategory
  tags: string[]
  locationMode: LocationMode
  timing?: string
  boundaries: Boundary[]
  urgency?: 'low' | 'medium' | 'high'
  createdAt: string
}

export type OfferIntent = {
  id: string
  userId: string
  category: SurrogateCategory
  locationMode: LocationMode
  timing?: string
  boundaries: Boundary[]
  capacity?: number
  currentCapacity?: number
  rating?: number
  reviewCount?: number
  createdAt: string
}

export type ViewerIntent = {
  profile: ViewerProfileIntent
  needs: NeedIntent[]
  offers: OfferIntent[]
}

export type RecommendationCandidate<T> = {
  item: T
  recommendation: RecommendationMeta
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const roundScore = (value: number) => Math.round(clamp01(value) * 100)

const normalizeText = (value?: string) =>
  (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3)

const overlapRatio = (left: string[], right: string[]) => {
  if (!left.length || !right.length) return 0
  const rightSet = new Set(right)
  const intersection = left.filter((value) => rightSet.has(value)).length
  return intersection / Math.max(1, Math.min(left.length, right.length))
}

const boundaryFit = (left: Boundary[], right: Boundary[]) => {
  if (!left.length || !right.length) return 0.5
  return overlapRatio(left, right)
}

const locationFit = (left: LocationMode, right: LocationMode) => {
  if (left === 'either' || right === 'either') return 1
  return left === right ? 1 : 0
}

const timingFit = (left?: string, right?: string) => {
  if (!left || !right) return 0.5
  const leftTokens = normalizeText(left)
  const rightTokens = normalizeText(right)
  if (!leftTokens.length || !rightTokens.length) return 0.5
  return overlapRatio(leftTokens, rightTokens)
}

const freshness = (createdAt: string, now: Date) => {
  const ageMs = Math.max(0, now.getTime() - new Date(createdAt).getTime())
  const ageDays = ageMs / 86_400_000
  if (ageDays <= 1) return 1
  if (ageDays <= 7) return 0.85
  if (ageDays <= 30) return 0.6
  if (ageDays <= 90) return 0.35
  return 0.15
}

const offerTrust = (rating?: number, reviewCount?: number) => {
  if (typeof rating !== 'number' || !Number.isFinite(rating) || !reviewCount) return 0.5
  const boundedRating = Math.max(1, Math.min(5, rating)) / 5
  const confidence = Math.min(1, reviewCount / 20)
  return 0.5 + (boundedRating - 0.5) * confidence
}

const buildRecommendation = (input: {
  weightedScore: number
  confidence: number
  reasons: RecommendationReason[]
}): RecommendationMeta => ({
  score: Math.max(0, Math.min(100, Math.round(input.weightedScore))),
  confidence: Math.max(0, Math.min(1, Math.round(input.confidence * 100) / 100)),
  reasons: input.reasons
    .filter((reason) => reason.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 4),
  rankingVersion: FYP_RANKING_VERSION,
})

function bestNeedForOffer(offer: OfferIntent, needs: NeedIntent[], profile: ViewerProfileIntent, now: Date): RecommendationMeta {
  if (!needs.length) {
    const boundary = boundaryFit(profile.boundaries, offer.boundaries)
    const location = locationFit(profile.locationMode, offer.locationMode)
    return buildRecommendation({
      weightedScore: 100 * (0.45 * boundary + 0.3 * location + 0.25 * freshness(offer.createdAt, now)),
      confidence: 0.45,
      reasons: [
        { code: 'PROFILE_BOUNDARY_MATCH', label: 'Fits your boundaries', contribution: 45 * boundary },
        { code: 'LOCATION_MATCH', label: 'Fits your location preference', contribution: 30 * location },
        { code: 'FRESH_LISTING', label: 'Recently listed', contribution: 25 * freshness(offer.createdAt, now) },
      ],
    })
  }

  return needs
    .map((need) => {
      const boundary = boundaryFit(need.boundaries, offer.boundaries)
      const location = locationFit(need.locationMode, offer.locationMode)
      const category = need.category === offer.category ? 1 : 0.25
      const timing = timingFit(need.timing, offer.timing)
      const fresh = freshness(offer.createdAt, now)
      const trust = offerTrust(offer.rating, offer.reviewCount)
      const capacity = typeof offer.capacity === 'number' && typeof offer.currentCapacity === 'number'
        ? Math.max(0, offer.capacity - offer.currentCapacity) > 0 ? 1 : 0
        : 0.5
      return buildRecommendation({
        weightedScore: 100 * (0.3 * boundary + 0.2 * location + 0.18 * category + 0.12 * timing + 0.08 * fresh + 0.07 * trust + 0.05 * capacity),
        confidence: 0.8,
        reasons: [
          { code: 'BOUNDARY_MATCH', label: 'Boundary fit', contribution: 30 * boundary },
          { code: 'LOCATION_MATCH', label: 'Location fit', contribution: 20 * location },
          { code: 'CATEGORY_MATCH', label: 'Matches your Need category', contribution: 18 * category },
          { code: 'TIMING_MATCH', label: 'Timing fit', contribution: 12 * timing },
          { code: 'FRESH_LISTING', label: 'Recently listed', contribution: 8 * fresh },
          { code: 'TRUST_SIGNAL', label: 'Established trust signals', contribution: 7 * trust },
          { code: 'AVAILABLE_CAPACITY', label: 'Capacity available', contribution: 5 * capacity },
        ],
      })
    })
    .sort((a, b) => b.score - a.score)[0]
}

function bestOfferForNeed(need: NeedIntent, offers: OfferIntent[], profile: ViewerProfileIntent, now: Date): RecommendationMeta {
  if (!offers.length) {
    const boundary = boundaryFit(profile.boundaries, need.boundaries)
    const location = locationFit(profile.locationMode, need.locationMode)
    const urgency = need.urgency === 'high' ? 1 : need.urgency === 'medium' ? 0.6 : 0.2
    return buildRecommendation({
      weightedScore: 100 * (0.45 * boundary + 0.3 * location + 0.15 * freshness(need.createdAt, now) + 0.1 * urgency),
      confidence: 0.45,
      reasons: [
        { code: 'PROFILE_BOUNDARY_MATCH', label: 'Fits your boundaries', contribution: 45 * boundary },
        { code: 'LOCATION_MATCH', label: 'Fits your location preference', contribution: 30 * location },
        { code: 'FRESH_LISTING', label: 'Recently listed', contribution: 15 * freshness(need.createdAt, now) },
        { code: 'URGENT_NEED', label: 'Time-sensitive Need', contribution: 10 * urgency },
      ],
    })
  }

  return offers
    .map((offer) => {
      const boundary = boundaryFit(need.boundaries, offer.boundaries)
      const location = locationFit(need.locationMode, offer.locationMode)
      const category = need.category === offer.category ? 1 : 0.25
      const timing = timingFit(need.timing, offer.timing)
      const fresh = freshness(need.createdAt, now)
      const urgency = need.urgency === 'high' ? 1 : need.urgency === 'medium' ? 0.6 : 0.2
      return buildRecommendation({
        weightedScore: 100 * (0.32 * boundary + 0.22 * location + 0.2 * category + 0.12 * timing + 0.08 * fresh + 0.06 * urgency),
        confidence: 0.8,
        reasons: [
          { code: 'BOUNDARY_MATCH', label: 'Boundary fit', contribution: 32 * boundary },
          { code: 'LOCATION_MATCH', label: 'Location fit', contribution: 22 * location },
          { code: 'CATEGORY_MATCH', label: 'Matches your Offer category', contribution: 20 * category },
          { code: 'TIMING_MATCH', label: 'Timing fit', contribution: 12 * timing },
          { code: 'FRESH_LISTING', label: 'Recently listed', contribution: 8 * fresh },
          { code: 'URGENT_NEED', label: 'Time-sensitive Need', contribution: 6 * urgency },
        ],
      })
    })
    .sort((a, b) => b.score - a.score)[0]
}

export function rankOffersForViewer(viewer: ViewerIntent, offers: OfferIntent[], now = new Date()): RecommendationCandidate<OfferIntent>[] {
  return offers
    .filter((offer) => offer.userId !== viewer.profile.userId)
    .map((offer) => ({ item: offer, recommendation: bestNeedForOffer(offer, viewer.needs, viewer.profile, now) }))
    .sort((a, b) => b.recommendation.score - a.recommendation.score || a.item.id.localeCompare(b.item.id))
}

export function rankNeedsForViewer(viewer: ViewerIntent, needs: NeedIntent[], now = new Date()): RecommendationCandidate<NeedIntent>[] {
  return needs
    .filter((need) => need.userId !== viewer.profile.userId)
    .map((need) => ({ item: need, recommendation: bestOfferForNeed(need, viewer.offers, viewer.profile, now) }))
    .sort((a, b) => b.recommendation.score - a.recommendation.score || a.item.id.localeCompare(b.item.id))
}
