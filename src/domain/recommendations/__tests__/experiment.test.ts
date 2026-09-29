import {
  assignFypExperimentCohort,
  evaluateFypExperimentGuardrails,
} from '@/domain/recommendations/experiment'
import type { ShadowGraduationDecision } from '@/domain/recommendations/shadowEvaluation'

const graduated = (overrides: Partial<ShadowGraduationDecision> = {}): ShadowGraduationDecision => ({
  eligibleForLimitedExperiment: true,
  reasons: [],
  thresholds: {
    minimumEvaluatedCount: 500,
    minimumOutcomeCount: 50,
    maximumHarmfulDemotionRate: 0.35,
    minimumNetOutcomeRankGain: 1,
  },
  ...overrides,
})

describe('FYP controlled experiment governance', () => {
  it('assigns actors deterministically so cohort membership is sticky across sessions', () => {
    const policy = {
      enabled: true,
      killSwitch: false,
      requestedTrafficPercent: 5,
      graduation: graduated(),
    }

    const first = assignFypExperimentCohort({ actorId: 'user-123', policy })
    const second = assignFypExperimentCohort({ actorId: 'user-123', policy })

    expect(second).toEqual(first)
  })

  it('keeps every actor in control when the experiment is disabled', () => {
    const assignment = assignFypExperimentCohort({
      actorId: 'user-123',
      policy: {
        enabled: false,
        killSwitch: false,
        requestedTrafficPercent: 5,
        graduation: graduated(),
      },
    })

    expect(assignment.cohort).toBe('control')
    expect(assignment.candidateAuthorized).toBe(false)
    expect(assignment.authorizedTrafficPercent).toBe(0)
    expect(assignment.reasons).toContain('experiment_disabled')
  })

  it('forces control immediately when the kill switch is active', () => {
    const assignment = assignFypExperimentCohort({
      actorId: 'user-123',
      policy: {
        enabled: true,
        killSwitch: true,
        requestedTrafficPercent: 5,
        graduation: graduated(),
      },
    })

    expect(assignment.cohort).toBe('control')
    expect(assignment.candidateAuthorized).toBe(false)
    expect(assignment.reasons).toContain('experiment_kill_switch_active')
  })

  it('refuses experiment traffic above the initial 5 percent cap', () => {
    const assignment = assignFypExperimentCohort({
      actorId: 'user-123',
      policy: {
        enabled: true,
        killSwitch: false,
        requestedTrafficPercent: 6,
        graduation: graduated(),
      },
    })

    expect(assignment.cohort).toBe('control')
    expect(assignment.candidateAuthorized).toBe(false)
    expect(assignment.reasons).toContain('requested_traffic_exceeds_initial_cap:6/5')
  })

  it('refuses experiment traffic when shadow graduation has not passed', () => {
    const assignment = assignFypExperimentCohort({
      actorId: 'user-123',
      policy: {
        enabled: true,
        killSwitch: false,
        requestedTrafficPercent: 5,
        graduation: graduated({
          eligibleForLimitedExperiment: false,
          reasons: ['insufficient_outcome_samples:12/50'],
        }),
      },
    })

    expect(assignment.cohort).toBe('control')
    expect(assignment.candidateAuthorized).toBe(false)
    expect(assignment.reasons).toContain('insufficient_outcome_samples:12/50')
  })

  it('does not judge matured outcome performance before enough candidate exposure exists', () => {
    const decision = evaluateFypExperimentGuardrails({
      controlExposureCount: 1000,
      candidateExposureCount: 99,
      candidateSafetyExposureCount: 100,
      controlOutcomeCount: 150,
      candidateOutcomeCount: 1,
      candidateSafetyIncidentCount: 0,
    })

    expect(decision.action).toBe('insufficient_evidence')
    expect(decision.reasons).toContain('insufficient_candidate_exposures:99/100')
  })

  it('does not compare candidate outcomes against an undersized matured control sample', () => {
    const decision = evaluateFypExperimentGuardrails({
      controlExposureCount: 99,
      candidateExposureCount: 100,
      candidateSafetyExposureCount: 100,
      controlOutcomeCount: 30,
      candidateOutcomeCount: 1,
      candidateSafetyIncidentCount: 0,
    })

    expect(decision.action).toBe('insufficient_evidence')
    expect(decision.reasons).toContain('insufficient_control_exposures:99/100')
  })

  it('orders rollback when matured candidate outcome performance materially regresses', () => {
    const decision = evaluateFypExperimentGuardrails({
      controlExposureCount: 1000,
      candidateExposureCount: 100,
      candidateSafetyExposureCount: 100,
      controlOutcomeCount: 200,
      candidateOutcomeCount: 10,
      candidateSafetyIncidentCount: 0,
    })

    expect(decision.action).toBe('rollback')
    expect(decision.reasons).toContain('candidate_outcome_rate_regression:0.1')
  })

  it('orders immediate safety rollback even before outcome exposure has matured', () => {
    const decision = evaluateFypExperimentGuardrails({
      controlExposureCount: 0,
      candidateExposureCount: 0,
      candidateSafetyExposureCount: 100,
      controlOutcomeCount: 0,
      candidateOutcomeCount: 0,
      candidateSafetyIncidentCount: 2,
    })

    expect(decision.action).toBe('rollback')
    expect(decision.candidateSafetyIncidentRate).toBe(0.02)
    expect(decision.reasons).toContain('candidate_safety_incident_rate:0.02')
  })

  it('waits for safety sample volume when no other guardrail is evaluable', () => {
    const decision = evaluateFypExperimentGuardrails({
      controlExposureCount: 0,
      candidateExposureCount: 0,
      candidateSafetyExposureCount: 99,
      controlOutcomeCount: 0,
      candidateOutcomeCount: 0,
      candidateSafetyIncidentCount: 2,
    })

    expect(decision.action).toBe('insufficient_evidence')
    expect(decision.reasons).toContain('insufficient_candidate_safety_exposures:99/100')
  })

  it('continues only when safety and matured outcome evidence are sufficient and healthy', () => {
    const decision = evaluateFypExperimentGuardrails({
      controlExposureCount: 1000,
      candidateExposureCount: 100,
      candidateSafetyExposureCount: 125,
      controlOutcomeCount: 120,
      candidateOutcomeCount: 13,
      candidateSafetyIncidentCount: 0,
    })

    expect(decision.action).toBe('continue')
    expect(decision.reasons).toEqual([])
  })
})
