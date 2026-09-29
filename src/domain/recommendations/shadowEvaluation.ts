export type ShadowOutcomeSignal = {
  subjectType: 'need' | 'offer'
  subjectId: string
  baselinePosition: number
  shadowPosition: number
  rankDelta: number
  outcome: 'proposalAccepted' | 'exchangeCompleted' | 'feedbackSubmitted' | null
}

export type ShadowOutcomeEvaluation = {
  evaluatedCount: number
  outcomeCount: number
  promotedOutcomeCount: number
  demotedOutcomeCount: number
  unchangedOutcomeCount: number
  netOutcomeRankGain: number
  meanOutcomeRankGain: number
  harmfulDemotionRate: number
}

export type ShadowGraduationDecision = {
  eligibleForLimitedExperiment: boolean
  reasons: string[]
  thresholds: {
    minimumEvaluatedCount: number
    minimumOutcomeCount: number
    maximumHarmfulDemotionRate: number
    minimumNetOutcomeRankGain: number
  }
}

export type LimitedExperimentAllocation = {
  authorized: boolean
  requestedTrafficPercent: number
  authorizedTrafficPercent: number
  maximumTrafficPercent: number
  reasons: string[]
}

export const FYP_SHADOW_GRADUATION_THRESHOLDS = {
  minimumEvaluatedCount: 500,
  minimumOutcomeCount: 50,
  maximumHarmfulDemotionRate: 0.35,
  minimumNetOutcomeRankGain: 1,
} as const

export const FYP_INITIAL_EXPERIMENT_MAX_TRAFFIC_PERCENT = 5 as const

const round4 = (value: number) => Math.round(value * 10_000) / 10_000

export function evaluateShadowOutcomes(signals: ShadowOutcomeSignal[]): ShadowOutcomeEvaluation {
  const outcomeSignals = signals.filter((signal) => signal.outcome !== null)
  const netOutcomeRankGain = outcomeSignals.reduce((sum, signal) => sum + signal.rankDelta, 0)
  const promotedOutcomeCount = outcomeSignals.filter((signal) => signal.rankDelta > 0).length
  const demotedOutcomeCount = outcomeSignals.filter((signal) => signal.rankDelta < 0).length
  const unchangedOutcomeCount = outcomeSignals.filter((signal) => signal.rankDelta === 0).length

  return {
    evaluatedCount: signals.length,
    outcomeCount: outcomeSignals.length,
    promotedOutcomeCount,
    demotedOutcomeCount,
    unchangedOutcomeCount,
    netOutcomeRankGain,
    meanOutcomeRankGain: outcomeSignals.length ? round4(netOutcomeRankGain / outcomeSignals.length) : 0,
    harmfulDemotionRate: outcomeSignals.length ? round4(demotedOutcomeCount / outcomeSignals.length) : 0,
  }
}

export function decideShadowGraduation(
  evaluation: ShadowOutcomeEvaluation,
  input?: {
    dataIntegrityViolationCount?: number
    thresholds?: Partial<typeof FYP_SHADOW_GRADUATION_THRESHOLDS>
  },
): ShadowGraduationDecision {
  const thresholds = {
    ...FYP_SHADOW_GRADUATION_THRESHOLDS,
    ...(input?.thresholds ?? {}),
  }
  const reasons: string[] = []
  const dataIntegrityViolationCount = input?.dataIntegrityViolationCount ?? 0

  if (evaluation.evaluatedCount < thresholds.minimumEvaluatedCount) {
    reasons.push(`insufficient_evaluated_samples:${evaluation.evaluatedCount}/${thresholds.minimumEvaluatedCount}`)
  }
  if (evaluation.outcomeCount < thresholds.minimumOutcomeCount) {
    reasons.push(`insufficient_outcome_samples:${evaluation.outcomeCount}/${thresholds.minimumOutcomeCount}`)
  }
  if (evaluation.harmfulDemotionRate > thresholds.maximumHarmfulDemotionRate) {
    reasons.push(`harmful_demotion_rate:${evaluation.harmfulDemotionRate}`)
  }
  if (evaluation.netOutcomeRankGain < thresholds.minimumNetOutcomeRankGain) {
    reasons.push(`non_positive_outcome_rank_gain:${evaluation.netOutcomeRankGain}`)
  }
  if (dataIntegrityViolationCount > 0) {
    reasons.push(`data_integrity_violations:${dataIntegrityViolationCount}`)
  }

  return {
    eligibleForLimitedExperiment: reasons.length === 0,
    reasons,
    thresholds,
  }
}

export function authorizeLimitedExperimentAllocation(
  graduation: ShadowGraduationDecision,
  requestedTrafficPercent: number,
): LimitedExperimentAllocation {
  const reasons = [...graduation.reasons]
  if (!Number.isFinite(requestedTrafficPercent) || requestedTrafficPercent <= 0) {
    reasons.push('invalid_requested_traffic_percent')
  } else if (requestedTrafficPercent > FYP_INITIAL_EXPERIMENT_MAX_TRAFFIC_PERCENT) {
    reasons.push(`requested_traffic_exceeds_initial_cap:${requestedTrafficPercent}/${FYP_INITIAL_EXPERIMENT_MAX_TRAFFIC_PERCENT}`)
  }
  if (!graduation.eligibleForLimitedExperiment && graduation.reasons.length === 0) {
    reasons.push('shadow_graduation_not_authorized')
  }

  const authorized = graduation.eligibleForLimitedExperiment && reasons.length === 0
  return {
    authorized,
    requestedTrafficPercent,
    authorizedTrafficPercent: authorized ? requestedTrafficPercent : 0,
    maximumTrafficPercent: FYP_INITIAL_EXPERIMENT_MAX_TRAFFIC_PERCENT,
    reasons,
  }
}
