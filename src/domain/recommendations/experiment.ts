import {
  authorizeLimitedExperimentAllocation,
  type ShadowGraduationDecision,
} from '@/domain/recommendations/shadowEvaluation'

export const FYP_LIMITED_EXPERIMENT_VERSION = 'FYP_SHADOW_EXPLORATION_V1_LIMITED_EXPERIMENT_V1' as const
export const FYP_EXPERIMENT_BUCKET_COUNT = 10_000 as const

export type FypExperimentCohort = 'control' | 'candidate'

export type FypExperimentPolicy = {
  enabled: boolean
  killSwitch: boolean
  requestedTrafficPercent: number
  graduation: ShadowGraduationDecision
}

export type FypExperimentAssignment = {
  experimentVersion: typeof FYP_LIMITED_EXPERIMENT_VERSION
  cohort: FypExperimentCohort
  bucket: number
  authorizedTrafficPercent: number
  candidateAuthorized: boolean
  reasons: string[]
}

export type FypExperimentGuardrailInput = {
  controlExposureCount: number
  candidateExposureCount: number
  candidateSafetyExposureCount: number
  controlOutcomeCount: number
  candidateOutcomeCount: number
  candidateSafetyIncidentCount: number
}

export type FypExperimentGuardrailDecision = {
  action: 'continue' | 'rollback' | 'insufficient_evidence'
  controlOutcomeRate: number
  candidateOutcomeRate: number
  candidateSafetyIncidentRate: number
  reasons: string[]
}

export const FYP_EXPERIMENT_GUARDRAILS = {
  minimumControlExposures: 100,
  minimumCandidateExposures: 100,
  minimumCandidateSafetyExposures: 100,
  maximumOutcomeRateRegression: 0.05,
  maximumSafetyIncidentRate: 0.01,
} as const

function stableBucket(seed: string): number {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % FYP_EXPERIMENT_BUCKET_COUNT
}

const rate = (numerator: number, denominator: number): number => (
  denominator > 0 ? Math.round((numerator / denominator) * 10_000) / 10_000 : 0
)

export function assignFypExperimentCohort(input: {
  actorId: string
  policy: FypExperimentPolicy
}): FypExperimentAssignment {
  const allocation = authorizeLimitedExperimentAllocation(
    input.policy.graduation,
    input.policy.requestedTrafficPercent,
  )
  const reasons = [...allocation.reasons]
  if (!input.policy.enabled) reasons.push('experiment_disabled')
  if (input.policy.killSwitch) reasons.push('experiment_kill_switch_active')

  const candidateAuthorized = allocation.authorized && input.policy.enabled && !input.policy.killSwitch
  const bucket = stableBucket(`${FYP_LIMITED_EXPERIMENT_VERSION}:${input.actorId}`)
  const candidateBucketLimit = Math.floor(allocation.authorizedTrafficPercent * 100)
  const cohort: FypExperimentCohort = candidateAuthorized && bucket < candidateBucketLimit
    ? 'candidate'
    : 'control'

  return {
    experimentVersion: FYP_LIMITED_EXPERIMENT_VERSION,
    cohort,
    bucket,
    authorizedTrafficPercent: candidateAuthorized ? allocation.authorizedTrafficPercent : 0,
    candidateAuthorized,
    reasons,
  }
}

export function evaluateFypExperimentGuardrails(
  input: FypExperimentGuardrailInput,
): FypExperimentGuardrailDecision {
  const controlOutcomeRate = rate(input.controlOutcomeCount, input.controlExposureCount)
  const candidateOutcomeRate = rate(input.candidateOutcomeCount, input.candidateExposureCount)
  const candidateSafetyIncidentRate = rate(
    input.candidateSafetyIncidentCount,
    input.candidateSafetyExposureCount,
  )
  const rollbackReasons: string[] = []

  const safetyEvidenceReady = input.candidateSafetyExposureCount >= FYP_EXPERIMENT_GUARDRAILS.minimumCandidateSafetyExposures
  if (
    safetyEvidenceReady
    && candidateSafetyIncidentRate > FYP_EXPERIMENT_GUARDRAILS.maximumSafetyIncidentRate
  ) {
    rollbackReasons.push(`candidate_safety_incident_rate:${candidateSafetyIncidentRate}`)
  }

  const outcomeEvidenceReady = (
    input.controlExposureCount >= FYP_EXPERIMENT_GUARDRAILS.minimumControlExposures
    && input.candidateExposureCount >= FYP_EXPERIMENT_GUARDRAILS.minimumCandidateExposures
  )
  if (
    outcomeEvidenceReady
    && controlOutcomeRate - candidateOutcomeRate > FYP_EXPERIMENT_GUARDRAILS.maximumOutcomeRateRegression
  ) {
    rollbackReasons.push(`candidate_outcome_rate_regression:${Math.round((controlOutcomeRate - candidateOutcomeRate) * 10_000) / 10_000}`)
  }

  if (rollbackReasons.length) {
    return {
      action: 'rollback',
      controlOutcomeRate,
      candidateOutcomeRate,
      candidateSafetyIncidentRate,
      reasons: rollbackReasons,
    }
  }

  const evidenceReasons: string[] = []
  if (!safetyEvidenceReady) {
    evidenceReasons.push(`insufficient_candidate_safety_exposures:${input.candidateSafetyExposureCount}/${FYP_EXPERIMENT_GUARDRAILS.minimumCandidateSafetyExposures}`)
  }
  if (input.controlExposureCount < FYP_EXPERIMENT_GUARDRAILS.minimumControlExposures) {
    evidenceReasons.push(`insufficient_control_exposures:${input.controlExposureCount}/${FYP_EXPERIMENT_GUARDRAILS.minimumControlExposures}`)
  }
  if (input.candidateExposureCount < FYP_EXPERIMENT_GUARDRAILS.minimumCandidateExposures) {
    evidenceReasons.push(`insufficient_candidate_exposures:${input.candidateExposureCount}/${FYP_EXPERIMENT_GUARDRAILS.minimumCandidateExposures}`)
  }

  return {
    action: evidenceReasons.length ? 'insufficient_evidence' : 'continue',
    controlOutcomeRate,
    candidateOutcomeRate,
    candidateSafetyIncidentRate,
    reasons: evidenceReasons,
  }
}
