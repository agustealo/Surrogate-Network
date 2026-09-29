import 'server-only'

import type { Json } from '@/infrastructure/supabase/database.types'
import { createClient } from '@/infrastructure/supabase/server'

export const FYP_EVENT_ACTIONS = {
  impression: 'fyp.impression',
  open: 'fyp.open',
  save: 'fyp.save',
  unsave: 'fyp.unsave',
  notInterested: 'fyp.not_interested',
  proposalCreated: 'fyp.proposal_created',
  proposalAccepted: 'fyp.proposal_accepted',
  exchangeCompleted: 'fyp.exchange_completed',
  feedbackSubmitted: 'fyp.feedback_submitted',
} as const

export type RecommendationSubjectType = 'need' | 'offer'
export type RecommendationEventAction = (typeof FYP_EVENT_ACTIONS)[keyof typeof FYP_EVENT_ACTIONS]

export type RecommendationEventInput = {
  actorId: string
  action: RecommendationEventAction
  subjectType: RecommendationSubjectType
  subjectId: string
  sessionId?: string
  rankingVersion?: string
  rankPosition?: number
  score?: number
  metadata?: Record<string, Json | undefined>
}

export type RecommendationHistory = {
  notInterested: Set<string>
  saved: Set<string>
  recentImpressionCounts: Map<string, number>
}

const keyFor = (subjectType: RecommendationSubjectType, subjectId: string) => `${subjectType}:${subjectId}`

export class RecommendationEventService {
  async record(input: RecommendationEventInput): Promise<void> {
    const supabase = await createClient()
    await this.recordWithClient(supabase, input)
  }

  async recordWithClient(
    supabase: Awaited<ReturnType<typeof createClient>>,
    input: RecommendationEventInput,
  ): Promise<void> {
    const payload: Json = {
      rankingVersion: input.rankingVersion ?? null,
      rankPosition: input.rankPosition ?? null,
      score: input.score ?? null,
      metadata: input.metadata ?? {},
    }

    const { error } = await supabase.from('audit_events').insert({
      action: input.action,
      actor_id: input.actorId,
      target_type: input.subjectType,
      target_id: input.subjectId,
      reason: input.sessionId ?? null,
      after: payload,
    })

    if (error) throw new Error(`Failed to record recommendation event: ${error.message}`)
  }

  async recordImpressions(
    actorId: string,
    sessionId: string,
    items: Array<{
      subjectType: RecommendationSubjectType
      subjectId: string
      rankingVersion: string
      rankPosition: number
      score: number
    }>,
  ): Promise<void> {
    if (!items.length) return
    const supabase = await createClient()
    const { data: existing, error: existingError } = await supabase
      .from('audit_events')
      .select('target_type,target_id')
      .eq('actor_id', actorId)
      .eq('action', FYP_EVENT_ACTIONS.impression)
      .eq('reason', sessionId)

    if (existingError) throw new Error(`Failed to read recommendation impressions: ${existingError.message}`)
    const existingKeys = new Set((existing ?? []).map((row) => `${row.target_type}:${row.target_id}`))
    const rows = items
      .filter((item) => !existingKeys.has(keyFor(item.subjectType, item.subjectId)))
      .map((item) => ({
        action: FYP_EVENT_ACTIONS.impression,
        actor_id: actorId,
        target_type: item.subjectType,
        target_id: item.subjectId,
        reason: sessionId,
        after: {
          rankingVersion: item.rankingVersion,
          rankPosition: item.rankPosition,
          score: item.score,
        } as Json,
      }))

    if (!rows.length) return
    const { error } = await supabase.from('audit_events').insert(rows)
    if (error) throw new Error(`Failed to record recommendation impressions: ${error.message}`)
  }

  async historyFor(actorId: string, now = new Date()): Promise<RecommendationHistory> {
    const supabase = await createClient()
    const historyStart = new Date(now.getTime() - 90 * 86_400_000).toISOString()
    const recentStart = new Date(now.getTime() - 7 * 86_400_000).toISOString()
    const { data, error } = await supabase
      .from('audit_events')
      .select('action,target_type,target_id,timestamp')
      .eq('actor_id', actorId)
      .in('action', [
        FYP_EVENT_ACTIONS.impression,
        FYP_EVENT_ACTIONS.save,
        FYP_EVENT_ACTIONS.unsave,
        FYP_EVENT_ACTIONS.notInterested,
      ])
      .gte('timestamp', historyStart)
      .order('timestamp', { ascending: true })

    if (error) throw new Error(`Failed to read recommendation history: ${error.message}`)

    const notInterested = new Set<string>()
    const saved = new Set<string>()
    const recentImpressionCounts = new Map<string, number>()

    for (const event of data ?? []) {
      if ((event.target_type !== 'need' && event.target_type !== 'offer') || !event.target_id) continue
      const key = keyFor(event.target_type, event.target_id)
      if (event.action === FYP_EVENT_ACTIONS.save) saved.add(key)
      if (event.action === FYP_EVENT_ACTIONS.unsave) saved.delete(key)
      if (event.action === FYP_EVENT_ACTIONS.notInterested) {
        notInterested.add(key)
        saved.delete(key)
      }
      if (
        event.action === FYP_EVENT_ACTIONS.impression
        && event.timestamp
        && event.timestamp >= recentStart
      ) {
        recentImpressionCounts.set(key, (recentImpressionCounts.get(key) ?? 0) + 1)
      }
    }

    return { notInterested, saved, recentImpressionCounts }
  }

  async recordRelationshipOutcome(input: {
    actorId: string
    surrogacyId: string
    action: 'proposalAccepted' | 'exchangeCompleted' | 'feedbackSubmitted'
    metadata?: Record<string, Json | undefined>
  }): Promise<void> {
    const supabase = await createClient()
    const { data: relationship, error } = await supabase
      .from('surrogacies')
      .select('need_id,offer_id')
      .eq('id', input.surrogacyId)
      .single()
    if (error || !relationship) return

    const [{ data: need }, { data: offer }] = await Promise.all([
      supabase.from('needs').select('id,user_id').eq('id', relationship.need_id).single(),
      supabase.from('offers').select('id,user_id').eq('id', relationship.offer_id).single(),
    ])
    if (!need || !offer) return

    const subjectType: RecommendationSubjectType = need.user_id === input.actorId ? 'offer' : 'need'
    const subjectId = subjectType === 'offer' ? offer.id : need.id
    const action = FYP_EVENT_ACTIONS[input.action]
    await this.recordWithClient(supabase, {
      actorId: input.actorId,
      action,
      subjectType,
      subjectId,
      metadata: input.metadata,
    })
  }
}

export function recommendationSubjectKey(subjectType: RecommendationSubjectType, subjectId: string): string {
  return keyFor(subjectType, subjectId)
}
