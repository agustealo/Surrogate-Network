import type { Boundary, SurrogateCategory } from '@/domain/types'

export const FYP_RANKING_VERSION = 'FYP_BASELINE_V1' as const

export type LocationMode = 'remote' | 'local' | 'either'

export type RecommendationReason = {
  code:
    | 'BOUNDARY_MATCH'
    | 'LOCATION_MATCH'
    | 'CATEGORY_MATCH'
    | 'TIMING_MATCH'
    | 'TAG_MATCH'
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
  rankingVersion: typeof FYP_RANKING_VERSION
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
  const evidenceConfidence = Math.min(1, Math.log10(reviewCount + 1) / 2)
  return 0.5 + (boundedRating - 0.5) * evidenceConfidence
}

const urgencyQuality = (urgency?: NeedIntent['urgency']) => {
  if (urgency === 'high') return 1
  if (urgency === 'medium') return 0.75
  if (urgency === 'low') return 0.55
  return 0.5
}

const capacityQuality = (capacity?: number, currentCapacity?: number) => {
  if (!capacity || capacity <= 0) return 0.5
  const remaining = Math.max(0, capacity - (currentCapacity ?? 0))
  return clamp01(remaining / capacity)
}

const confidenceFromSignals = (signalCount: number) => clamp01(0.45 + Math.min(signalCount, 5) * 0.1)

const reason = (code: RecommendationReason['code'], label: string, contribution: number): RecommendationReason => ({
  code,
  label,
  contribution: Math.round(contribution * 100) / 100,
})

function scoreNeedAgainstOffer(need: NeedIntent, offer: OfferIntent) {
  const boundary = boundaryFit(need.boundaries, offer.boundaries)
  const location = locationFit(need.locationMode, offer.locationMode)
  const category = need.category === offer.category ? 1 : 0.35
  const timing = timingFit(need.timing, offer.timing)

  return {
    score: boundary * 0.4 + location * 0.25 + category * 0.2 + timing * 0.15,
    reasons: [
      ...(boundary >= 0.5 ? [reason('BOUNDARY_MATCH', 'Compatible boundaries', boundary * 0.4)] : []),
      ...(location >= 1 ? [reason('LOCATION_MATCH', 'Location preference matches', location * 0.25)] : []),
      ...(category >= 1 ? [reason('CATEGORY_MATCH', 'Matches your active listing category', category * 0.2)] : []),
      ...(timing > 0.5 ? [reason('TIMING_MATCH', 'Availability appears aligned', timing * 0.15)] : []),
    ],
  }
}

function scoreNeedForProfile(need: NeedIntent, profile: ViewerProfileIntent) {
  const boundary = boundaryFit(need.boundaries, profile.boundaries)
  const location = locationFit(need.locationMode, profile.locationMode)
  const timing = timingFit(need.timing, profile.availability)

  return {
    score: boundary * 0.5 + location * 0.3 + timing * 0.2,
    reasons: [
      ...(boundary >= 0.5 ? [reason('PROFILE_BOUNDARY_MATCH', 'Matches your profile boundaries', boundary * 0.5)] : []),
      ...(location >= 1 ? [reason('LOCATION_MATCH', 'Location preference matches', location * 0.3)] : []),
      ...(timing > 0.5 ? [reason('TIMING_MATCH', 'Availability appears aligned', timing * 0.2)] : []),
    ],
  }
}

function scoreOfferForProfile(offer: OfferIntent, profile: ViewerProfileIntent) {
  const boundary = boundaryFit(offer.boundaries, profile.boundaries)
  const location = locationFit(offer.locationMode, profile.locationMode)
  const timing = timingFit(offer.timing, profile.availability)

  return {
    score: boundary * 0.5 + location * 0.3 + timing * 0.2,
    reasons: [
      ...(boundary >= 0.5 ? [reason('PROFILE_BOUNDARY_MATCH', 'Matches your profile boundaries', boundary * 0.5)] : []),
      ...(location >= 1 ? [reason('LOCATION_MATCH', 'Location preference matches', location * 0.3)] : []),
      ...(timing > 0.5 ? [reason('TIMING_MATCH', 'Availability appears aligned', timing * 0.2)] : []),
    ],
  }
}

function bestCompatibility<T>(items: T[], scorer: (item: T) => { score: number; reasons: RecommendationReason[] }, fallback: { score: number; reasons: RecommendationReason[] }) {
  return items.reduce((best, item) => {
    const current = scorer(item)
    return current.score > best.score ? current : best
  }, fallback)
}

export function rankNeedsForViewer<T extends NeedIntent>(viewer: ViewerIntent, candidates: T[], now = new Date()): RecommendationCandidate<T>[] {
  const ranked = candidates
    .filter((candidate) => candidate.userId !== viewer.profile.userId)
    .map((candidate) => {
      const profileFallback = scoreNeedForProfile(candidate, viewer.profile)
      const compatibility = viewer.offers.length
        ? bestCompatibility(viewer.offers, (offer) => scoreNeedAgainstOffer(candidate, offer), profileFallback)
        : profileFallback
      const fresh = freshness(candidate.createdAt, now)
      const quality = urgencyQuality(candidate.urgency)
      const score = compatibility.score * 0.7 + fresh * 0.2 + quality * 0.1
      const reasons = [
        ...compatibility.reasons,
        ...(fresh >= 0.85 ? [reason('FRESH_LISTING', 'Recently posted', fresh * 0.2)] : []),
        ...(candidate.urgency === 'high' ? [reason('URGENT_NEED', 'High-priority request', quality * 0.1)] : []),
      ]
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 3)

      return {
        item: candidate,
        recommendation: {
          score: roundScore(score),
          confidence: roundScore(confidenceFromSignals(reasons.length)),
          reasons,
          rankingVersion: FYP_RANKING_VERSION,
        },
      }
    })
    .sort((left, right) => right.recommendation.score - left.recommendation.score || new Date(right.item.createdAt).getTime() - new Date(left.item.createdAt).getTime())

  return diversify(ranked)
}

export function rankOffersForViewer<T extends OfferIntent>(viewer: ViewerIntent, candidates: T[], now = new Date()): RecommendationCandidate<T>[] {
  const ranked = candidates
    .filter((candidate) => candidate.userId !== viewer.profile.userId)
    .map((candidate) => {
      const profileFallback = scoreOfferForProfile(candidate, viewer.profile)
      const compatibility = viewer.needs.length
        ? bestCompatibility(viewer.needs, (need) => scoreNeedAgainstOffer(need, candidate), profileFallback)
        : profileFallback
      const fresh = freshness(candidate.createdAt, now)
      const trust = offerTrust(candidate.rating, candidate.reviewCount)
      const capacity = capacityQuality(candidate.capacity, candidate.currentCapacity)
      const score = compatibility.score * 0.65 + fresh * 0.15 + trust * 0.15 + capacity * 0.05
      const reasons = [
        ...compatibility.reasons,
        ...(fresh >= 0.85 ? [reason('FRESH_LISTING', 'Recently posted', fresh * 0.15)] : []),
        ...(trust > 0.55 ? [reason('TRUST_SIGNAL', 'Supported by completed-review history', trust * 0.15)] : []),
        ...(capacity > 0.5 ? [reason('AVAILABLE_CAPACITY', 'Has available capacity', capacity * 0.05)] : []),
      ]
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 3)

      return {
        item: candidate,
        recommendation: {
          score: roundScore(score),
          confidence: roundScore(confidenceFromSignals(reasons.length)),
          reasons,
          rankingVersion: FYP_RANKING_VERSION,
        },
      }
    })
    .sort((left, right) => right.recommendation.score - left.recommendation.score || new Date(right.item.createdAt).getTime() - new Date(left.item.createdAt).getTime())

  return diversify(ranked)
}

function diversify<T extends { userId: string; category: SurrogateCategory }>(ranked: RecommendationCandidate<T>[]) {
  const remaining = [...ranked]
  const output: RecommendationCandidate<T>[] = []
  const ownerCounts = new Map<string, number>()
  const categoryCounts = new Map<SurrogateCategory, number>()

  while (remaining.length) {
    let bestIndex = 0
    let bestAdjustedScore = Number.NEGATIVE_INFINITY

    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index]
      const ownerPenalty = (ownerCounts.get(candidate.item.userId) ?? 0) * 8
      const categoryPenalty = (categoryCounts.get(candidate.item.category) ?? 0) * 2
      const adjustedScore = candidate.recommendation.score - ownerPenalty - categoryPenalty
      if (adjustedScore > bestAdjustedScore) {
        bestAdjustedScore = adjustedScore
        bestIndex = index
      }
    }

    const [selected] = remaining.splice(bestIndex, 1)
    output.push(selected)
    ownerCounts.set(selected.item.userId, (ownerCounts.get(selected.item.userId) ?? 0) + 1)
    categoryCounts.set(selected.item.category, (categoryCounts.get(selected.item.category) ?? 0) + 1)
  }

  return output
}
