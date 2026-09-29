import 'server-only'

import { FYP_EVENT_ACTIONS, type RecommendationSubjectType } from '@/application/services/RecommendationEventService'
import {
  decideShadowGraduation,
  evaluateShadowOutcomes,
  type ShadowGraduationDecision,
  type ShadowOutcomeEvaluation,
  type ShadowOutcomeSignal,
} from '@/domain/recommendations/shadowEvaluation'
import { FYP_SHADOW_RANKING_VERSION } from '@/domain/recommendations/shadow'
import type { Json } from '@/infrastructure/supabase/database.types'
import { createClient } from '@/infrastructure/supabase/server'

const OUTCOME_WINDOW_MS = 30 * 86_400_000
const DEFAULT_LOOKBACK_MS = 90 * 86_400_000

const outcomeActions = [
  FYP_EVENT_ACTIONS.proposalAccepted,
  FYP_EVENT_ACTIONS.exchangeCompleted,
  FYP_EVENT_ACTIONS.feedbackSubmitted,
] as const

type OutcomeName = ShadowOutcomeSignal['outcome']

type AuditRow = {
  actor_id: string
  action: string
  target_type: string | null
  target_id: string | null
  timestamp: string | null
  after: Json | null
}

type ParsedShadow = {
  actorId: string
  subjectType: RecommendationSubjectType
  subjectId: string
  timestampMs: number
  baselinePosition: number
  shadowPosition: number
  rankDelta: number
}

type ParsedOutcome = {
  timestampMs: number
  outcome: Exclude<OutcomeName, null>
}

export type ShadowRankingEvaluationReport = {
  rankingVersion: typeof FYP_SHADOW_RANKING_VERSION
  windowStart: string
  windowEnd: string
  evaluation: ShadowOutcomeEvaluation
  graduation: ShadowGraduationDecision
  dataIntegrityViolationCount: number
}

function asRecord(value: Json | null | undefined): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function outcomeName(action: string): OutcomeName {
  if (action === FYP_EVENT_ACTIONS.proposalAccepted) return 'proposalAccepted'
  if (action === FYP_EVENT_ACTIONS.exchangeCompleted) return 'exchangeCompleted'
  if (action === FYP_EVENT_ACTIONS.feedbackSubmitted) return 'feedbackSubmitted'
  return null
}

function subjectKey(actorId: string, subjectType: RecommendationSubjectType, subjectId: string): string {
  return `${actorId}:${subjectType}:${subjectId}`
}

function attributablePair(
  observations: ParsedShadow[],
  outcomes: ParsedOutcome[],
): { observation: ParsedShadow; outcome: ParsedOutcome } | null {
  for (const outcome of outcomes) {
    const eligible = observations.filter((observation) => (
      observation.timestampMs <= outcome.timestampMs
      && outcome.timestampMs - observation.timestampMs <= OUTCOME_WINDOW_MS
    ))
    if (eligible.length) {
      return {
        observation: eligible[eligible.length - 1],
        outcome,
      }
    }
  }
  return null
}

export class ShadowRankingEvaluationService {
  async evaluateForActor(
    actorId: string,
    options?: { now?: Date; lookbackMs?: number },
  ): Promise<ShadowRankingEvaluationReport> {
    const now = options?.now ?? new Date()
    const windowStart = new Date(now.getTime() - (options?.lookbackMs ?? DEFAULT_LOOKBACK_MS))
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('audit_events')
      .select('actor_id,action,target_type,target_id,timestamp,after')
      .eq('actor_id', actorId)
      .in('action', [FYP_EVENT_ACTIONS.shadowImpression, ...outcomeActions])
      .gte('timestamp', windowStart.toISOString())
      .lte('timestamp', now.toISOString())
      .order('timestamp', { ascending: true })

    if (error) throw new Error(`Failed to evaluate shadow ranking: ${error.message}`)
    return this.buildReport(data as AuditRow[] ?? [], windowStart, now)
  }

  async evaluateGlobal(options?: { now?: Date; lookbackMs?: number }): Promise<ShadowRankingEvaluationReport> {
    const now = options?.now ?? new Date()
    const windowStart = new Date(now.getTime() - (options?.lookbackMs ?? DEFAULT_LOOKBACK_MS))
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('audit_events')
      .select('actor_id,action,target_type,target_id,timestamp,after')
      .in('action', [FYP_EVENT_ACTIONS.shadowImpression, ...outcomeActions])
      .gte('timestamp', windowStart.toISOString())
      .lte('timestamp', now.toISOString())
      .order('timestamp', { ascending: true })

    if (error) throw new Error(`Failed to evaluate global shadow ranking: ${error.message}`)
    return this.buildReport(data as AuditRow[] ?? [], windowStart, now)
  }

  buildReport(rows: AuditRow[], windowStart: Date, windowEnd: Date): ShadowRankingEvaluationReport {
    const shadowsBySubject = new Map<string, ParsedShadow[]>()
    const outcomesBySubject = new Map<string, ParsedOutcome[]>()
    let dataIntegrityViolationCount = 0

    for (const row of rows) {
      if (!row.actor_id || (row.target_type !== 'need' && row.target_type !== 'offer') || !row.target_id || !row.timestamp) {
        dataIntegrityViolationCount += 1
        continue
      }
      const timestampMs = Date.parse(row.timestamp)
      if (!Number.isFinite(timestampMs)) {
        dataIntegrityViolationCount += 1
        continue
      }
      const key = subjectKey(row.actor_id, row.target_type, row.target_id)

      if (row.action === FYP_EVENT_ACTIONS.shadowImpression) {
        const after = asRecord(row.after)
        const metadata = asRecord(after?.metadata as Json | undefined)
        const rankingVersion = after?.rankingVersion
        const shadowPosition = finiteNumber(after?.rankPosition)
        const baselinePosition = finiteNumber(metadata?.baselinePosition)
        const rankDelta = finiteNumber(metadata?.rankDelta)
        if (
          rankingVersion !== FYP_SHADOW_RANKING_VERSION
          || shadowPosition === null
          || baselinePosition === null
          || rankDelta === null
          || baselinePosition - shadowPosition !== rankDelta
        ) {
          dataIntegrityViolationCount += 1
          continue
        }
        const observation: ParsedShadow = {
          actorId: row.actor_id,
          subjectType: row.target_type,
          subjectId: row.target_id,
          timestampMs,
          baselinePosition,
          shadowPosition,
          rankDelta,
        }
        const observations = shadowsBySubject.get(key) ?? []
        observations.push(observation)
        shadowsBySubject.set(key, observations)
        continue
      }

      const outcome = outcomeName(row.action)
      if (!outcome) continue
      const after = asRecord(row.after)
      const metadata = asRecord(after?.metadata as Json | undefined)
      if (metadata?.excludedFromShadowEvaluation === true) continue
      const outcomes = outcomesBySubject.get(key) ?? []
      outcomes.push({ timestampMs, outcome })
      outcomesBySubject.set(key, outcomes)
    }

    const signals: ShadowOutcomeSignal[] = []
    for (const observations of shadowsBySubject.values()) {
      const ordered = [...observations].sort((left, right) => left.timestampMs - right.timestampMs)
      const first = ordered[0]
      const subjectOutcomes = [
        ...(outcomesBySubject.get(subjectKey(first.actorId, first.subjectType, first.subjectId)) ?? []),
      ].sort((left, right) => left.timestampMs - right.timestampMs)
      const attributed = attributablePair(ordered, subjectOutcomes)
      const chosen = attributed?.observation ?? ordered[ordered.length - 1]

      signals.push({
        subjectType: chosen.subjectType,
        subjectId: chosen.subjectId,
        baselinePosition: chosen.baselinePosition,
        shadowPosition: chosen.shadowPosition,
        rankDelta: chosen.rankDelta,
        outcome: attributed?.outcome.outcome ?? null,
      })
    }

    const evaluation = evaluateShadowOutcomes(signals)
    const graduation = decideShadowGraduation(evaluation, { dataIntegrityViolationCount })
    return {
      rankingVersion: FYP_SHADOW_RANKING_VERSION,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      evaluation,
      graduation,
      dataIntegrityViolationCount,
    }
  }
}
