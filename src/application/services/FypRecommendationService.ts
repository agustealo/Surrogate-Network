import 'server-only'

import { createClient } from '@/infrastructure/supabase/server'
import {
  rankNeedsForViewer,
  rankOffersForViewer,
  type NeedIntent,
  type OfferIntent,
  type RecommendationCandidate,
  type ViewerIntent,
} from '@/domain/recommendations/scoring'
import type { Boundary, SurrogateCategory } from '@/domain/types'

const CANDIDATE_WINDOW = 100
const FEED_LIMIT = 24

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
  created_at: string
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
  created_at: string
}

export type FypNeed = NeedRow & {
  recommendation: RecommendationCandidate<NeedIntent>['recommendation']
}

export type FypOffer = OfferRow & {
  recommendation: RecommendationCandidate<OfferIntent>['recommendation']
}

export type FypFeed = {
  needs: FypNeed[]
  offers: FypOffer[]
}

export class FypRecommendationService {
  async getFeed(): Promise<FypFeed> {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) throw new Error('You must be signed in to discover recommendations.')

    const [profileResult, ownNeedsResult, ownOffersResult, needsResult, offersResult] = await Promise.all([
      supabase.from('profiles').select('id,boundaries,availability').eq('id', user.id).single(),
      supabase
        .from('needs')
        .select('id,category,tags,location_mode,timing,boundaries,urgency,user_id,created_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(25),
      supabase
        .from('offers')
        .select('id,category,location_mode,timing,boundaries,capacity,current_capacity,rating,review_count,user_id,created_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(25),
      supabase
        .from('needs')
        .select('id,title,description,category,tags,location_mode,timing,boundaries,urgency,user_id,user_name,created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(CANDIDATE_WINDOW),
      supabase
        .from('offers')
        .select('id,title,description,category,location_mode,timing,boundaries,capacity,current_capacity,user_id,user_name,rating,review_count,created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(CANDIDATE_WINDOW),
    ])

    if (profileResult.error || !profileResult.data) throw new Error('Your profile is unavailable for recommendation ranking.')
    if (ownNeedsResult.error) throw new Error(`Failed to load your Needs: ${ownNeedsResult.error.message}`)
    if (ownOffersResult.error) throw new Error(`Failed to load your Offers: ${ownOffersResult.error.message}`)
    if (needsResult.error) throw new Error(`Failed to load candidate Needs: ${needsResult.error.message}`)
    if (offersResult.error) throw new Error(`Failed to load candidate Offers: ${offersResult.error.message}`)

    const viewer: ViewerIntent = {
      profile: {
        userId: user.id,
        boundaries: (profileResult.data.boundaries ?? []) as Boundary[],
        locationMode: 'either',
        availability: profileResult.data.availability ?? undefined,
      },
      needs: (ownNeedsResult.data ?? []).map((row) => this.toNeedIntent(row)),
      offers: (ownOffersResult.data ?? []).map((row) => this.toOfferIntent(row)),
    }

    const rankedNeeds = rankNeedsForViewer(viewer, (needsResult.data ?? []).map((row) => this.toNeedIntent(row as NeedRow)))
      .slice(0, FEED_LIMIT)
    const rankedOffers = rankOffersForViewer(viewer, (offersResult.data ?? []).map((row) => this.toOfferIntent(row as OfferRow)))
      .slice(0, FEED_LIMIT)

    const needRows = new Map((needsResult.data ?? []).map((row) => [row.id, row as NeedRow]))
    const offerRows = new Map((offersResult.data ?? []).map((row) => [row.id, row as OfferRow]))

    return {
      needs: rankedNeeds.flatMap(({ item, recommendation }) => {
        const row = needRows.get(item.id)
        return row ? [{ ...row, recommendation }] : []
      }),
      offers: rankedOffers.flatMap(({ item, recommendation }) => {
        const row = offerRows.get(item.id)
        return row ? [{ ...row, recommendation }] : []
      }),
    }
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
    created_at: string
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
      createdAt: row.created_at,
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
    created_at: string
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
      createdAt: row.created_at,
    }
  }
}
