import 'server-only'

import { FYP_LIMITED_EXPERIMENT_VERSION } from '@/domain/recommendations/experiment'
import type { Json } from '@/infrastructure/supabase/database.types'
import { createClient } from '@/infrastructure/supabase/server'

export const FYP_EVENT_ACTIONS = {
  impression: 'fyp.impression',
  shadowImpression: 'fyp.shadow_impression',
  experimentImpression: 'fyp.experiment_impression',
  safetyIncident: 'fyp.safety_incident',
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

export type FypSafetyExposure = {
  subjectType: RecommendationSubjectType
  subjectId: string
  experimentVersion: typeof FYP_LIMITED_EXPERIMENT_VERSION
  experimentCohort: 'control' | 'candidate'
}

const keyFor = (subjectType: RecommendationSubjectType, subjectId: string) => `${subjectType}:${subjectId}`
const EXPERIMENT_OUTCOME_WINDOW_MS = 30 * 86_400_000
const EMPTY_UUID = '00000000-0000-0000-0000-000000000000'

function asRecord(value: Json | null | undefined): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

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
    await this.recordImpressionBatch(actorId, sessionId, FYP_EVENT_ACTIONS.impression, items)
  }

  async recordShadowImpressions(
    actorId: string,
    sessionId: string,
    items: Array<{
      subjectType: RecommendationSubjectType
      subjectId: string
      rankingVersion: string
      rankPosition: number
      score: number
      metadata?: Record<string, Json | undefined>
    }>,
  ): Promise<void> {
    await this.recordImpressionBatch(actorId, sessionId, FYP_EVENT_ACTIONS.shadowImpression, items)
  }

  async recordExperimentImpressions(
    actorId: string,
    sessionId: string,
    items: Array<{
      subjectType: RecommendationSubjectType
      subjectId: string
      rankingVersion: string
      rankPosition: number
      score: number
      metadata?: Record<string, Json | undefined>
    }>,
  ): Promise<void> {
    await this.recordImpressionBatch(actorId, sessionId, FYP_EVENT_ACTIONS.experimentImpression, items)
  }

  private async recordImpressionBatch(
    actorId: string,
    sessionId: string,
    action:
      | typeof FYP_EVENT_ACTIONS.impression
      | typeof FYP_EVENT_ACTIONS.shadowImpression
      | typeof FYP_EVENT_ACTIONS.experimentImpression,
    items: Array<{
      subjectType: RecommendationSubjectType
      subjectId: string
      rankingVersion: string
      rankPosition: number
      score: number
      metadata?: Record<string, Json | undefined>
    }>,
  ): Promise<void> {
    if (!items.length) return
    const supabase = await createClient()
    const { data: existing, error: existingError } = await supabase
      .from('audit_events')
      .select('target_type,target_id')
      .eq('actor_id', actorId)
      .eq('action', action)
      .eq('reason', sessionId)

    if (existingError) throw new Error(`Failed to read recommendation impressions: ${existingError.message}`)
    const existingKeys = new Set((existing ?? []).map((row) => `${row.target_type}:${row.target_id}`))
    const rows = items
      .filter((item) => !existingKeys.has(keyFor(item.subjectType, item.subjectId)))
      .map((item) => ({
        action,
        actor_id: actorId,
        target_type: item.subjectType,
        target_id: item.subjectId,
        reason: sessionId,
        after: {
          rankingVersion: item.rankingVersion,
          rankPosition: item.rankPosition,
          score: item.score,
          metadata: item.metadata ?? {},
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

  async resolveSafetyExposureForMember(input: {
    actorId: string
    targetUserId: string
  }): Promise<FypSafetyExposure | null> {
    const supabase = await createClient()
    const windowStart = new Date(Date.now() - EXPERIMENT_OUTCOME_WINDOW_MS).toISOString()
    const { data: exposures, error: exposureError } = await supabase
      .from('audit_events')
      .select('target_type,target_id,timestamp,after')
      .eq('actor_id', input.actorId)
      .eq('action', FYP_EVENT_ACTIONS.experimentImpression)
      .gte('timestamp', windowStart)
      .order('timestamp', { ascending: false })

    if (exposureError) throw new Error(`Failed to read FYP safety attribution history: ${exposureError.message}`)
    if (!exposures?.length) return null

    const needIds = exposures
      .filter((row) => row.target_type === 'need' && row.target_id)
      .map((row) => row.target_id as string)
    const offerIds = exposures
      .filter((row) => row.target_type === 'offer' && row.target_id)
      .map((row) => row.target_id as string)

    const [{ data: needs, error: needsError }, { data: offers, error: offersError }] = await Promise.all([
      supabase.from('needs').select('id,user_id').in('id', needIds.length ? needIds : [EMPTY_UUID]),
      supabase.from('offers').select('id,user_id').in('id', offerIds.length ? offerIds : [EMPTY_UUID]),
    ])
    if (needsError || offersError) {
      throw new Error(`Failed to resolve FYP safety attribution ownership: ${needsError?.message ?? offersError?.message}`)
    }

    const ownerBySubject = new Map<string, string>()
    for (const need of needs ?? []) ownerBySubject.set(keyFor('need', need.id), need.user_id)
    for (const offer of offers ?? []) ownerBySubject.set(keyFor('offer', offer.id), offer.user_id)

    const exposure = exposures.find((row) => (
      (row.target_type === 'need' || row.target_type === 'offer')
      && row.target_id
      && ownerBySubject.get(keyFor(row.target_type, row.target_id)) === input.targetUserId
    ))
    if (!exposure || (exposure.target_type !== 'need' && exposure.target_type !== 'offer') || !exposure.target_id) return null

    const after = asRecord(exposure.after)
    const metadata = asRecord(after?.metadata as Json | undefined)
    const experimentVersion = metadata?.experimentVersion
    const experimentCohort = metadata?.experimentCohort
    if (
      experimentVersion !== FYP_LIMITED_EXPERIMENT_VERSION
      || (experimentCohort !== 'control' && experimentCohort !== 'candidate')
    ) return null

    return {
      subjectType: exposure.target_type,
      subjectId: exposure.target_id,
      experimentVersion,
      experimentCohort,
    }
  }

  async recordSafetyIncidentFromExposure(input: {
    actorId: string
    targetUserId: string
    incidentType: 'block' | 'report'
    severity?: 'low' | 'medium' | 'high'
    exposure: FypSafetyExposure | null
  }): Promise<void> {
    if (!input.exposure) return
    const supabase = await createClient()
    const reason = `${input.incidentType}:${input.targetUserId}`
    const { data: existing, error: existingError } = await supabase
      .from('audit_events')
      .select('id')
      .eq('actor_id', input.actorId)
      .eq('action', FYP_EVENT_ACTIONS.safetyIncident)
      .eq('target_type', input.exposure.subjectType)
      .eq('target_id', input.exposure.subjectId)
      .eq('reason', reason)
      .limit(1)

    if (existingError) throw new Error(`Failed to deduplicate FYP safety incident: ${existingError.message}`)
    if (existing?.length) return

    await this.recordWithClient(supabase, {
      actorId: input.actorId,
      action: FYP_EVENT_ACTIONS.safetyIncident,
      subjectType: input.exposure.subjectType,
      subjectId: input.exposure.subjectId,
      sessionId: reason,
      metadata: {
        experimentVersion: input.exposure.experimentVersion,
        experimentCohort: input.exposure.experimentCohort,
        incidentType: input.incidentType,
        incidentSeverity: input.severity ?? null,
        exposedMemberId: input.targetUserId,
        excludedFromShadowEvaluation: true,
      },
    })

    const { FypExperimentGuardrailService } = await import('@/application/services/FypExperimentGuardrailService')
    await new FypExperimentGuardrailService().evaluateAndRollback()
  }

  async recordSafetyIncidentForExposedMember(input: {
    actorId: string
    targetUserId: string
    incidentType: 'block' | 'report'
    severity?: 'low' | 'medium' | 'high'
  }): Promise<void> {
    const exposure = await this.resolveSafetyExposureForMember(input)
    await this.recordSafetyIncidentFromExposure({ ...input, exposure })
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
    const experimentWindowStart = new Date(Date.now() - EXPERIMENT_OUTCOME_WINDOW_MS).toISOString()
    const { data: experimentRows } = await supabase
      .from('audit_events')
      .select('after')
      .eq('actor_id', input.actorId)
      .eq('action', FYP_EVENT_ACTIONS.experimentImpression)
      .eq('target_type', subjectType)
      .eq('target_id', subjectId)
      .gte('timestamp', experimentWindowStart)
      .order('timestamp', { ascending: false })
      .limit(1)

    const experimentAfter = asRecord(experimentRows?.[0]?.after)
    const experimentMetadata = asRecord(experimentAfter?.metadata as Json | undefined)
    const experimentVersion = experimentMetadata?.experimentVersion
    const experimentCohort = experimentMetadata?.experimentCohort
    const hasExperimentProvenance = experimentVersion === FYP_LIMITED_EXPERIMENT_VERSION
      && (experimentCohort === 'control' || experimentCohort === 'candidate')

    await this.recordWithClient(supabase, {
      actorId: input.actorId,
      action,
      subjectType,
      subjectId,
      metadata: {
        ...(input.metadata ?? {}),
        ...(hasExperimentProvenance ? {
          experimentVersion,
          experimentCohort,
          excludedFromShadowEvaluation: true,
        } : {}),
      },
    })

    if (hasExperimentProvenance) {
      const { FypExperimentGuardrailService } = await import('@/application/services/FypExperimentGuardrailService')
      await new FypExperimentGuardrailService().evaluateAndRollback()
    }
  }
}

export function recommendationSubjectKey(subjectType: RecommendationSubjectType, subjectId: string): string {
  return keyFor(subjectType, subjectId)
}
