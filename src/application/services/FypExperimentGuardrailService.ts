import 'server-only'

import {
  FYP_EVENT_ACTIONS,
  type RecommendationSubjectType,
} from '@/application/services/RecommendationEventService'
import {
  FypExperimentPolicyService,
  type PersistedFypExperimentPolicy,
} from '@/application/services/FypExperimentPolicyService'
import {
  evaluateFypExperimentGuardrails,
  FYP_LIMITED_EXPERIMENT_VERSION,
  type FypExperimentCohort,
  type FypExperimentGuardrailDecision,
  type FypExperimentGuardrailInput,
} from '@/domain/recommendations/experiment'
import type { Json } from '@/infrastructure/supabase/database.types'
import { createServiceClient } from '@/infrastructure/supabase/server'

const LIVE_GUARDRAIL_WINDOW_MS = 30 * 86_400_000

const outcomeActions = new Set<string>([
  FYP_EVENT_ACTIONS.proposalAccepted,
  FYP_EVENT_ACTIONS.exchangeCompleted,
  FYP_EVENT_ACTIONS.feedbackSubmitted,
])

type AuditRow = {
  actor_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  timestamp: string | null
  after: Json | null
}

export type FypExperimentGuardrailReport = {
  policyEventId: string | null
  windowStart: string
  windowEnd: string
  input: FypExperimentGuardrailInput
  decision: FypExperimentGuardrailDecision
  malformedEvidenceCount: number
  rollbackPersisted: boolean
}

function asRecord(value: Json | null | undefined): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function cohortFrom(row: AuditRow): FypExperimentCohort | null {
  const after = asRecord(row.after)
  const metadata = asRecord(after?.metadata as Json | undefined)
  if (metadata?.experimentVersion !== FYP_LIMITED_EXPERIMENT_VERSION) return null
  return metadata.experimentCohort === 'control' || metadata.experimentCohort === 'candidate'
    ? metadata.experimentCohort
    : null
}

function subjectKey(row: AuditRow): string | null {
  if (
    !row.actor_id
    || (row.target_type !== 'need' && row.target_type !== 'offer')
    || !row.target_id
  ) return null
  return `${row.actor_id}:${row.target_type}:${row.target_id}`
}

function laterDate(left: Date, right: Date): Date {
  return left.getTime() >= right.getTime() ? left : right
}

export class FypExperimentGuardrailService {
  async evaluateLive(options?: { now?: Date }): Promise<FypExperimentGuardrailReport> {
    const policy = await new FypExperimentPolicyService().currentPolicy({ privileged: true })
    return this.evaluatePolicy(policy, options?.now ?? new Date())
  }

  async evaluateAndRollback(options?: { now?: Date }): Promise<FypExperimentGuardrailReport> {
    const policyService = new FypExperimentPolicyService()
    const policy = await policyService.currentPolicy({ privileged: true })
    const report = await this.evaluatePolicy(policy, options?.now ?? new Date())

    if (
      !policy.policyEventId
      || !policy.enabled
      || policy.killSwitch
      || report.decision.action !== 'rollback'
    ) return report

    const latestPolicy = await policyService.currentPolicy({ privileged: true })
    if (
      latestPolicy.policyEventId !== policy.policyEventId
      || !latestPolicy.enabled
      || latestPolicy.killSwitch
    ) return report

    await policyService.appendSystemRollback({
      enabled: latestPolicy.enabled,
      killSwitch: true,
      requestedTrafficPercent: latestPolicy.requestedTrafficPercent,
      graduation: latestPolicy.graduation,
      reason: `auto_guardrail_rollback:${latestPolicy.policyEventId}:${report.decision.reasons.join('|')}`,
    })

    return { ...report, rollbackPersisted: true }
  }

  async evaluatePolicy(
    policy: PersistedFypExperimentPolicy,
    now: Date,
  ): Promise<FypExperimentGuardrailReport> {
    const fallbackStart = new Date(now.getTime() - LIVE_GUARDRAIL_WINDOW_MS)
    const changedAt = policy.changedAt ? new Date(policy.changedAt) : null
    const windowStart = changedAt && Number.isFinite(changedAt.getTime())
      ? laterDate(changedAt, fallbackStart)
      : fallbackStart

    if (!policy.policyEventId) {
      return this.buildReport([], policy.policyEventId, windowStart, now)
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('audit_events')
      .select('actor_id,action,target_type,target_id,timestamp,after')
      .in('action', [
        FYP_EVENT_ACTIONS.experimentImpression,
        FYP_EVENT_ACTIONS.proposalAccepted,
        FYP_EVENT_ACTIONS.exchangeCompleted,
        FYP_EVENT_ACTIONS.feedbackSubmitted,
        FYP_EVENT_ACTIONS.safetyIncident,
      ])
      .gte('timestamp', windowStart.toISOString())
      .lte('timestamp', now.toISOString())
      .order('timestamp', { ascending: true })

    if (error) throw new Error(`Failed to evaluate live FYP experiment guardrails: ${error.message}`)
    return this.buildReport(data as AuditRow[] ?? [], policy.policyEventId, windowStart, now)
  }

  buildReport(
    rows: AuditRow[],
    policyEventId: string | null,
    windowStart: Date,
    windowEnd: Date,
  ): FypExperimentGuardrailReport {
    const exposures = new Map<string, FypExperimentCohort>()
    const outcomes = new Map<string, FypExperimentCohort>()
    const safetyIncidents = new Map<string, FypExperimentCohort>()
    let malformedEvidenceCount = 0

    for (const row of rows) {
      const key = subjectKey(row)
      const cohort = cohortFrom(row)
      if (!key || !cohort) {
        const after = asRecord(row.after)
        const metadata = asRecord(after?.metadata as Json | undefined)
        if (metadata?.experimentVersion === FYP_LIMITED_EXPERIMENT_VERSION) {
          malformedEvidenceCount += 1
        }
        continue
      }

      if (row.action === FYP_EVENT_ACTIONS.experimentImpression) {
        const existing = exposures.get(key)
        if (existing && existing !== cohort) {
          malformedEvidenceCount += 1
          continue
        }
        exposures.set(key, cohort)
        continue
      }

      if (outcomeActions.has(row.action)) {
        outcomes.set(key, cohort)
        continue
      }

      if (row.action === FYP_EVENT_ACTIONS.safetyIncident) {
        safetyIncidents.set(key, cohort)
      }
    }

    let controlExposureCount = 0
    let candidateExposureCount = 0
    let controlOutcomeCount = 0
    let candidateOutcomeCount = 0
    let candidateSafetyIncidentCount = 0

    for (const cohort of exposures.values()) {
      if (cohort === 'control') controlExposureCount += 1
      else candidateExposureCount += 1
    }
    for (const [key, cohort] of outcomes) {
      if (exposures.get(key) !== cohort) continue
      if (cohort === 'control') controlOutcomeCount += 1
      else candidateOutcomeCount += 1
    }
    for (const [key, cohort] of safetyIncidents) {
      if (cohort === 'candidate' && exposures.get(key) === 'candidate') {
        candidateSafetyIncidentCount += 1
      }
    }

    const input: FypExperimentGuardrailInput = {
      controlExposureCount,
      candidateExposureCount,
      controlOutcomeCount,
      candidateOutcomeCount,
      candidateSafetyIncidentCount,
    }

    return {
      policyEventId,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      input,
      decision: evaluateFypExperimentGuardrails(input),
      malformedEvidenceCount,
      rollbackPersisted: false,
    }
  }
}
