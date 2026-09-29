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
import {
  FypFeedSnapshotService,
  type FypFeedSessionSnapshot,
  type FypFeedSnapshotItem,
} from '@/application/services/FypFeedSnapshotService'
import { FypExperimentService } from '@/application/services/FypExperimentService'
import {
  RecommendationEventService,
  recommendationSubjectKey,
} from '@/application/services/RecommendationEventService'
import type { Boundary, SurrogateCategory } from '@/domain/types'

const FEED_LIMIT = 24
const REPEAT_IMPRESSION_LIMIT = 3
const UNKNOWN_CREATED_AT = '1970-01-01T00:00:00.000Z'
const EMPTY_UUID = '00000000-0000-0000-0000-000000000000'

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
  rankPosition: number
  saved: boolean
}
export type FypOffer = OfferRow & {
  recommendation: RecommendationCandidate<OfferIntent>['recommendation']
  rankPosition: number
  saved: boolean
}

export type FypFeed = {
  sessionId: string
  generatedAt: string
  expiresAt: string
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
    const snapshotService = new FypFeedSnapshotService()
    const [profileResult, ownNeedsResult, ownOffersResult, history, experimentAssignment] = await Promise.all([
      supabase.from('profiles').select('id,boundaries,availability').eq('id', user.id).single(),
      supabase.from('needs').select('id,category,tags,location_mode,timing,boundaries,urgency,user_id,created_at').eq('user_id', user.id).eq('status', 'active').limit(25),
      supabase.from('offers').select('id,category,location_mode,timing,boundaries,capacity,current_capacity,rating,review_count,user_id,created_at').eq('user_id', user.id).eq('status', 'active').limit(25),
      eventService.historyFor(user.id, now),
      experimentService.assignmentForActor(user.id),
    ])

    if (profileResult.error || !profileResult.data) throw new Error('Your profile is unavailable for recommendation ranking.')
    if (ownNeedsResult.error) throw new Error(`Failed to load your Needs: ${ownNeedsResult.error.message}`)
    if (ownOffersResult.error) throw new Error(`Failed to load your Offers: ${ownOffersResult.error.message}`)

    const expectedRankingVersion = experimentAssignment.cohort === 'candidate'
      ? FYP_SHADOW_RANKING_VERSION
      : FYP_RANKING_VERSION
    const existingSnapshot = await snapshotService.current({
      actorId: user.id,
      rankingVersion: expectedRankingVersion,
      now,
    })

    if (existingSnapshot) {
      return this.hydrateSnapshot({
        supabase,
        snapshot: existingSnapshot,
        history,
        ownNeedIds: (ownNeedsResult.data ?? []).map((row) => row.id),
        ownOfferIds: (ownOffersResult.data ?? []).map((row) => row.id),
      })
    }

    const [recentNeedsResult, recentOffersResult] = await Promise.all([
      supabase.from('needs').select('id,title,description,category,tags,location_mode,timing,boundaries,urgency,user_id,user_name,created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(FYP_RECENT_POOL_LIMIT),
      supabase.from('offers').select('id,title,description,category,location_mode,timing,boundaries,capacity,current_capacity,user_id,user_name,rating,review_count,created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(FYP_RECENT_POOL_LIMIT),
    ])
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
    const eligibleNeeds = candidateNeeds.filter((row) => this.isGenerationEligible('need', row.id, history))
    const eligibleOffers = candidateOffers.filter((row) => this.isGenerationEligible('offer', row.id, history))
    const allRankedNeeds = rankNeedsForViewer(viewer, eligibleNeeds.map((row) => this.toNeedIntent(row)), now)
    const allRankedOffers = rankOffersForViewer(viewer, eligibleOffers.map((row) => this.toOfferIntent(row)), now)

    const sessionId = crypto.randomUUID()
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

    const snapshot = await snapshotService.create({
      actorId: user.id,
      sessionId,
      rankingVersion: expectedRankingVersion,
      now,
      needs: this.snapshotItems(selectedNeeds),
      offers: this.snapshotItems(selectedOffers),
    })

    await this.recordShadowRanking({
      actorId: user.id,
      sessionId,
      baselineNeeds: allRankedNeeds,
      baselineOffers: allRankedOffers,
      history,
      eventService,
    })

    return this.hydrateSnapshot({
      supabase,
      snapshot,
      history,
      ownNeedIds: (ownNeedsResult.data ?? []).map((row) => row.id),
      ownOfferIds: (ownOffersResult.data ?? []).map((row) => row.id),
    })
  }

  private async hydrateSnapshot(input: {
    supabase: Awaited<ReturnType<typeof createClient>>
    snapshot: FypFeedSessionSnapshot
    history: Awaited<ReturnType<RecommendationEventService['historyFor']>>
    ownNeedIds: string[]
    ownOfferIds: string[]
  }): Promise<FypFeed> {
    const needIds = input.snapshot.needs.map((item) => item.subjectId)
    const offerIds = input.snapshot.offers.map((item) => item.subjectId)
    const [{ data: needs, error: needsError }, { data: offers, error: offersError }] = await Promise.all([
      input.supabase
        .from('needs')
        .select('id,title,description,category,tags,location_mode,timing,boundaries,urgency,user_id,user_name,created_at')
        .in('id', needIds.length ? needIds : [EMPTY_UUID])
        .eq('status', 'active'),
      input.supabase
        .from('offers')
        .select('id,title,description,category,location_mode,timing,boundaries,capacity,current_capacity,user_id,user_name,rating,review_count,created_at')
        .in('id', offerIds.length ? offerIds : [EMPTY_UUID])
        .eq('status', 'active'),
    ])
    if (needsError) throw new Error(`Failed to hydrate FYP Need snapshot: ${needsError.message}`)
    if (offersError) throw new Error(`Failed to hydrate FYP Offer snapshot: ${offersError.message}`)

    const needRows = new Map((needs ?? []).map((row) => [row.id, row as NeedRow]))
    const offerRows = new Map((offers ?? []).map((row) => [row.id, row as OfferRow]))
    const needsOut: FypNeed[] = []
    const offersOut: FypOffer[] = []

    for (const item of input.snapshot.needs) {
      if (needsOut.length >= FEED_LIMIT) break
      const row = needRows.get(item.subjectId)
      if (!row || !this.isSnapshotEligible('need', item.subjectId, input.history)) continue
      needsOut.push({
        ...row,
        recommendation: item.recommendation,
        rankPosition: item.position,
        saved: input.history.saved.has(recommendationSubjectKey('need', item.subjectId)),
      })
    }
    for (const item of input.snapshot.offers) {
      if (offersOut.length >= FEED_LIMIT) break
      const row = offerRows.get(item.subjectId)
      if (!row || !this.isSnapshotEligible('offer', item.subjectId, input.history)) continue
      offersOut.push({
        ...row,
        recommendation: item.recommendation,
        rankPosition: item.position,
        saved: input.history.saved.has(recommendationSubjectKey('offer', item.subjectId)),
      })
    }

    return {
      sessionId: input.snapshot.sessionId,
      generatedAt: input.snapshot.generatedAt,
      expiresAt: input.snapshot.expiresAt,
      needs: needsOut,
      offers: offersOut,
      ownNeedIds: input.ownNeedIds,
      ownOfferIds: input.ownOfferIds,
    }
  }

  private snapshotItems<T extends NeedIntent | OfferIntent>(
    ranked: RecommendationCandidate<T>[],
  ): FypFeedSnapshotItem[] {
    return ranked.map((candidate, position) => ({
      subjectId: candidate.item.id,
      position,
      recommendation: candidate.recommendation,
    }))
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

  private isGenerationEligible(
    subjectType: 'need' | 'offer',
    subjectId: string,
    history: Awaited<ReturnType<RecommendationEventService['historyFor']>>,
  ): boolean {
    const key = recommendationSubjectKey(subjectType, subjectId)
    if (history.notInterested.has(key)) return false
    if (history.saved.has(key)) return true
    return (history.recentImpressionCounts.get(key) ?? 0) < REPEAT_IMPRESSION_LIMIT
  }

  private isSnapshotEligible(
    subjectType: 'need' | 'offer',
    subjectId: string,
    history: Awaited<ReturnType<RecommendationEventService['historyFor']>>,
  ): boolean {
    return !history.notInterested.has(recommendationSubjectKey(subjectType, subjectId))
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
