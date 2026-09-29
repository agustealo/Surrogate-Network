import 'server-only'

import { createClient } from '@/infrastructure/supabase/server'
import {
  FYP_RANKING_VERSION,
  rankNeedsForViewer,
  rankOffersForViewer,
  type NeedIntent,
  type OfferIntent,
  type RecommendationCandidate,
  type ViewerIntent,
} from '@/domain/recommendations/scoring'
import {
  FYP_INTENT_POOL_LIMIT,
  FYP_RECENT_POOL_LIMIT,
  intentPoolLimitPerCategory,
  mergeCandidatePools,
  preferredNeedCategories,
  preferredOfferCategories,
} from '@/domain/recommendations/retrieval'
import {
  FYP_SHADOW_RANKING_VERSION,
  buildShadowRanking,
  compareShadowRanking,
} from '@/domain/recommendations/shadow'
import { FypExperimentService } from '@/application/services/FypExperimentService'
import {
  RecommendationEventService,
  recommendationSubjectKey,
} from '@/application/services/RecommendationEventService'
import type { Boundary, SurrogateCategory } from '@/domain/types'

const FEED_LIMIT = 24
const REPEAT_IMPRESSION_LIMIT = 3
const UNKNOWN_CREATED_AT = '1970-01-01T00:00:00.000Z'

type NeedRow = {
  id: string
  title: string
  description: string
  category: SurrogateCategory
  tags: string[] | null
  location_mode: 'remote' | 'local' | 'either'
  timing: string | null
  boundaries: Boundary[] | null
  urgency: 'low' | 'medium' | 'high' | null
  user_id: string
  user_name: string
  created_at: string | null
}

type OfferRow = {
  id: string
  title: string
  description: string
  category: SurrogateCategory
  location_mode: 'remote' | 'local' | 'either'
  timing: string | null
  boundaries: Boundary[] | null
  capacity: number | null
  current_capacity: number | null
  user_id: string
  user_name: string
  rating: number | null
  review_count: number | null
  created_at: string | null
}

export type FypNeed = NeedRow & {
  recommendation: RecommendationCandidate<NeedIntent>['recommendation']
  saved: boolean
}
export type FypOffer = OfferRow & {
  recommendation: RecommendationCandidate<OfferIntent>['recommendation']
  saved: boolean
}

export type FypFeed = {
  sessionId: string
  needs: FypNeed[]
  offers: FypOffer[]
  ownNeedIds: string[]
  ownOfferIds: string[]
}

export class FypRecommendationService {
  async getFeed(now = new Date()): Promise<FypFeed> {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('You must be signed in to discover recommendations.')

    const eventService = new RecommendationEventService()
    const experimentService = new FypExperimentService()
    const [profileResult, ownNeedsResult, ownOffersResult, recentNeedsResult, recentOffersResult, history, experimentAssignment] = await Promise.all([
      supabase.from('profiles').select('id,boundaries,availability').eq('id', user.id).single(),
      supabase.from('needs').select('id,category,tags,location_mode,timing,boundaries,urgency,user_id,created_at').eq('user_id', user.id).eq('status', 'active').limit(25),
      supabase.from('offers').select('id,category,location_mode,timing,boundaries,capacity,current_capacity,rating,review_count,user_id,created_at').eq('user_id', user.id).eq('status', 'active').limit(25),
      supabase.from('needs').select('id,title,description,category,tags,location_mode,timing,boundaries,urgency,user_id,user_name,created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(FYP_RECENT_POOL_LIMIT),
      supabase.from('offers').select('id,title,description,category,location_mode,timing,boundaries,capacity,current_capacity,user_id,user_name,rating,review_count,created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(FYP_RECENT_POOL_LIMIT),
      eventService.historyFor(user.id, now),
      experimentService.assignmentForActor(user.id),
    ])

    if (profileResult.error || !profileResult.data) throw new Error('Your profile is unavailable for recommendation ranking.')
    if (ownNeedsResult.error) throw new Error(`Failed to load your Needs: ${ownNeedsResult.error.message}`)
    if (ownOffersResult.error) throw new Error(`Failed to load your Offers: ${ownOffersResult.error.message}`)
    if (recentNeedsResult.error) throw new Error(`Failed to load recent candidate Needs: ${recentNeedsResult.error.message}`)
    if (recentOffersResult.error) throw new Error(`Failed to load recent candidate Offers: ${recentOffersResult.error.message}`)

    const viewer: ViewerIntent = {
      profile: {
        userId: user.id,
        boundaries: (profileResult.data.boundaries ?? []) as Boundary[],
        availability: profileResult.data.availability ?? undefined,
      },
      needs: (ownNeedsResult.data ?? []).map((row) => this.toNeedIntent(row)),
      offers: (ownOffersResult.data ?? []).map((row) => this.toOfferIntent(row)),
    }

    const [intentNeeds, intentOffers] = await Promise.all([
      this.loadIntentNeeds(supabase, preferredNeedCategories(viewer)),
      this.loadIntentOffers(supabase, preferredOfferCategories(viewer)),
    ])

    const candidateNeeds = mergeCandidatePools(
      (recentNeedsResult.data ?? []).map((row) => row as NeedRow),
      intentNeeds,
    )
    const candidateOffers = mergeCandidatePools(
      (recentOffersResult.data ?? []).map((row) => row as OfferRow),
      intentOffers,
    )

    const needRows = new Map(candidateNeeds.map((row) => [row.id, row]))
    const offerRows = new Map(candidateOffers.map((row) => [row.id, row]))
    const eligibleNeeds = candidateNeeds.filter((row) => this.isEligible('need', row.id, history))
    const eligibleOffers = candidateOffers.filter((row) => this.isEligible('offer', row.id, history))
    const allRankedNeeds = rankNeedsForViewer(viewer, eligibleNeeds.map((row) => this.toNeedIntent(row)), now)
    const allRankedOffers = rankOffersForViewer(viewer, eligibleOffers.map((row) => this.toOfferIntent(row)), now)
    const sessionId = `${FYP_RANKING_VERSION}:${user.id}:${now.toISOString().slice(0, 10)}`

    const selectedNeeds = experimentAssignment.cohort === 'candidate'
      ? this.asCandidateRanking(buildShadowRanking({
          actorId: user.id,
          sessionId: `${sessionId}:${FYP_SHADOW_RANKING_VERSION}`,
          ranked: allRankedNeeds,
          recentImpressionCountFor: (subjectId) => history.recentImpressionCounts.get(recommendationSubjectKey('need', subjectId)) ?? 0,
        }))
      : allRankedNeeds
    const selectedOffers = experimentAssignment.cohort === 'candidate'
      ? this.asCandidateRanking(buildShadowRanking({
          actorId: user.id,
          sessionId: `${sessionId}:${FYP_SHADOW_RANKING_VERSION}`,
          ranked: allRankedOffers,
          recentImpressionCountFor: (subjectId) => history.recentImpressionCounts.get(recommendationSubjectKey('offer', subjectId)) ?? 0,
        }))
      : allRankedOffers

    const rankedNeeds = selectedNeeds.slice(0, FEED_LIMIT)
    const rankedOffers = selectedOffers.slice(0, FEED_LIMIT)

    await this.recordShadowRanking({
      actorId: user.id,
      sessionId,
      baselineNeeds: allRankedNeeds,
      baselineOffers: allRankedOffers,
      history,
      eventService,
    })

    return {
      sessionId,
      needs: rankedNeeds.flatMap(({ item, recommendation }) => {
        const row = needRows.get(item.id)
        return row ? [{
          ...row,
          recommendation,
          saved: history.saved.has(recommendationSubjectKey('need', item.id)),
        }] : []
      }),
      offers: rankedOffers.flatMap(({ item, recommendation }) => {
        const row = offerRows.get(item.id)
        return row ? [{
          ...row,
          recommendation,
          saved: history.saved.has(recommendationSubjectKey('offer', item.id)),
        }] : []
      }),
      ownNeedIds: (ownNeedsResult.data ?? []).map((row) => row.id),
      ownOfferIds: (ownOffersResult.data ?? []).map((row) => row.id),
    }
  }

  private async loadIntentNeeds(
    supabase: Awaited<ReturnType<typeof createClient>>,
    categories: SurrogateCategory[],
  ): Promise<NeedRow[]> {
    if (!categories.length) return []
    const perCategoryLimit = intentPoolLimitPerCategory(categories.length)
    const pools = await Promise.all(categories.map(async (category) => {
      const { data, error } = await supabase
        .from('needs')
        .select('id,title,description,category,tags,location_mode,timing,boundaries,urgency,user_id,user_name,created_at')
        .eq('status', 'active')
        .eq('category', category)
        .order('created_at', { ascending: false })
        .limit(perCategoryLimit)
      if (error) throw new Error(`Failed to load ${category} intent-aligned candidate Needs: ${error.message}`)
      return (data ?? []).map((row) => row as NeedRow)
    }))
    return mergeCandidatePools(...pools).slice(0, FYP_INTENT_POOL_LIMIT)
  }

  private async loadIntentOffers(
    supabase: Awaited<ReturnType<typeof createClient>>,
    categories: SurrogateCategory[],
  ): Promise<OfferRow[]> {
    if (!categories.length) return []
    const perCategoryLimit = intentPoolLimitPerCategory(categories.length)
    const pools = await Promise.all(categories.map(async (category) => {
      const { data, error } = await supabase
        .from('offers')
        .select('id,title,description,category,location_mode,timing,boundaries,capacity,current_capacity,user_id,user_name,rating,review_count,created_at')
        .eq('status', 'active')
        .eq('category', category)
        .order('created_at', { ascending: false })
        .limit(perCategoryLimit)
      if (error) throw new Error(`Failed to load ${category} intent-aligned candidate Offers: ${error.message}`)
      return (data ?? []).map((row) => row as OfferRow)
    }))
    return mergeCandidatePools(...pools).slice(0, FYP_INTENT_POOL_LIMIT)
  }

  private asCandidateRanking<T extends { id: string }>(
    shadow: ReturnType<typeof buildShadowRanking<T>>,
  ): RecommendationCandidate<T>[] {
    return shadow.map((candidate) => ({
      item: candidate.item,
      recommendation: {
        ...candidate.recommendation,
        score: candidate.shadowScore,
        rankingVersion: FYP_SHADOW_RANKING_VERSION,
      },
    }))
  }

  private async recordShadowRanking(input: {
    actorId: string
    sessionId: string
    baselineNeeds: RecommendationCandidate<NeedIntent>[]
    baselineOffers: RecommendationCandidate<OfferIntent>[]
    history: Awaited<ReturnType<RecommendationEventService['historyFor']>>
    eventService: RecommendationEventService
  }): Promise<void> {
    try {
      const shadowSessionId = `${input.sessionId}:${FYP_SHADOW_RANKING_VERSION}`
      const shadowNeeds = buildShadowRanking({
        actorId: input.actorId,
        sessionId: shadowSessionId,
        ranked: input.baselineNeeds,
        recentImpressionCountFor: (subjectId) => input.history.recentImpressionCounts.get(recommendationSubjectKey('need', subjectId)) ?? 0,
      })
      const shadowOffers = buildShadowRanking({
        actorId: input.actorId,
        sessionId: shadowSessionId,
        ranked: input.baselineOffers,
        recentImpressionCountFor: (subjectId) => input.history.recentImpressionCounts.get(recommendationSubjectKey('offer', subjectId)) ?? 0,
      })
      const needComparisons = compareShadowRanking({ subjectType: 'need', baseline: input.baselineNeeds, shadow: shadowNeeds, limit: FEED_LIMIT })
      const offerComparisons = compareShadowRanking({ subjectType: 'offer', baseline: input.baselineOffers, shadow: shadowOffers, limit: FEED_LIMIT })

      await input.eventService.recordShadowImpressions(
        input.actorId,
        shadowSessionId,
        [...needComparisons, ...offerComparisons].map((comparison) => ({
          subjectType: comparison.subjectType,
          subjectId: comparison.subjectId,
          rankingVersion: comparison.rankingVersion,
          rankPosition: comparison.shadowPosition,
          score: comparison.shadowScore,
          metadata: {
            controlRankingVersion: FYP_RANKING_VERSION,
            baselinePosition: comparison.baselinePosition,
            baselineScore: comparison.baselineScore,
            rankDelta: comparison.rankDelta,
          },
        })),
      )
    } catch {
      // Shadow ranking is observational only. Its failure must never degrade the consumer feed.
    }
  }

  private isEligible(
    subjectType: 'need' | 'offer',
    subjectId: string,
    history: Awaited<ReturnType<RecommendationEventService['historyFor']>>,
  ): boolean {
    const key = recommendationSubjectKey(subjectType, subjectId)
    if (history.notInterested.has(key)) return false
    if (history.saved.has(key)) return true
    return (history.recentImpressionCounts.get(key) ?? 0) < REPEAT_IMPRESSION_LIMIT
  }

  private toNeedIntent(row: {
    id: string
    category: SurrogateCategory
    tags: string[] | null
    location_mode: 'remote' | 'local' | 'either'
    timing: string | null
    boundaries: Boundary[] | null
    urgency: 'low' | 'medium' | 'high' | null
    user_id: string
    created_at: string | null
  }): NeedIntent {
    return {
      id: row.id,
      userId: row.user_id,
      category: row.category,
      tags: row.tags ?? [],
      locationMode: row.location_mode,
      timing: row.timing ?? undefined,
      boundaries: row.boundaries ?? [],
      urgency: row.urgency ?? undefined,
      createdAt: row.created_at ?? UNKNOWN_CREATED_AT,
    }
  }

  private toOfferIntent(row: {
    id: string
    category: SurrogateCategory
    location_mode: 'remote' | 'local' | 'either'
    timing: string | null
    boundaries: Boundary[] | null
    capacity: number | null
    current_capacity: number | null
    rating: number | null
    review_count: number | null
    user_id: string
    created_at: string | null
  }): OfferIntent {
    return {
      id: row.id,
      userId: row.user_id,
      category: row.category,
      locationMode: row.location_mode,
      timing: row.timing ?? undefined,
      boundaries: row.boundaries ?? [],
      capacity: row.capacity ?? undefined,
      currentCapacity: row.current_capacity ?? undefined,
      rating: row.rating ?? undefined,
      reviewCount: row.review_count ?? undefined,
      createdAt: row.created_at ?? UNKNOWN_CREATED_AT,
    }
  }
}
