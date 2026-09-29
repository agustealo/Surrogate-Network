import {
  decideShadowGraduation,
  evaluateShadowOutcomes,
  type ShadowOutcomeSignal,
} from '@/domain/recommendations/shadowEvaluation'

const signal = (overrides: Partial<ShadowOutcomeSignal> = {}): ShadowOutcomeSignal => ({
  subjectType: 'offer',
  subjectId: 'offer-1',
  baselinePosition: 4,
  shadowPosition: 2,
  rankDelta: 2,
  outcome: 'exchangeCompleted',
  ...overrides,
})

describe('shadow outcome evaluation', () => {
  it('measures outcome-bearing promotions and harmful demotions without inventing counterfactual conversions', () => {
    const evaluation = evaluateShadowOutcomes([
      signal({ subjectId: 'a', rankDelta: 3, outcome: 'proposalAccepted' }),
      signal({ subjectId: 'b', rankDelta: -2, outcome: 'exchangeCompleted' }),
      signal({ subjectId: 'c', rankDelta: 0, outcome: 'feedbackSubmitted' }),
      signal({ subjectId: 'd', rankDelta: 4, outcome: null }),
    ])

    expect(evaluation).toEqual({
      evaluatedCount: 4,
      outcomeCount: 3,
      promotedOutcomeCount: 1,
      demotedOutcomeCount: 1,
      unchangedOutcomeCount: 1,
      netOutcomeRankGain: 1,
      meanOutcomeRankGain: 0.3333,
      harmfulDemotionRate: 0.3333,
    })
  })

  it('fails closed when evidence volume is too small', () => {
    const evaluation = evaluateShadowOutcomes(Array.from({ length: 49 }, (_, index) => signal({ subjectId: `offer-${index}` })))
    const decision = decideShadowGraduation(evaluation)

    expect(decision.eligibleForLimitedExperiment).toBe(false)
    expect(decision.reasons).toContain('insufficient_evaluated_samples:49/500')
    expect(decision.reasons).toContain('insufficient_outcome_samples:49/50')
  })

  it('blocks a candidate that demotes too many subjects that later produce outcomes', () => {
    const signals = Array.from({ length: 500 }, (_, index) => signal({
      subjectId: `offer-${index}`,
      rankDelta: index < 20 ? -1 : index < 50 ? 1 : 0,
      outcome: index < 50 ? 'exchangeCompleted' : null,
    }))
    const decision = decideShadowGraduation(evaluateShadowOutcomes(signals))

    expect(decision.eligibleForLimitedExperiment).toBe(false)
    expect(decision.reasons).toContain('harmful_demotion_rate:0.4')
  })

  it('only declares eligibility for a limited experiment after every guardrail is satisfied', () => {
    const signals = Array.from({ length: 500 }, (_, index) => signal({
      subjectId: `offer-${index}`,
      rankDelta: index < 10 ? -1 : index < 50 ? 2 : 0,
      outcome: index < 50 ? 'feedbackSubmitted' : null,
    }))
    const decision = decideShadowGraduation(evaluateShadowOutcomes(signals))

    expect(decision).toMatchObject({
      eligibleForLimitedExperiment: true,
      reasons: [],
    })
  })

  it('blocks graduation when attribution integrity is compromised', () => {
    const evaluation = evaluateShadowOutcomes(Array.from({ length: 500 }, (_, index) => signal({
      subjectId: `offer-${index}`,
      rankDelta: index < 50 ? 1 : 0,
      outcome: index < 50 ? 'proposalAccepted' : null,
    })))
    const decision = decideShadowGraduation(evaluation, { dataIntegrityViolationCount: 1 })

    expect(decision.eligibleForLimitedExperiment).toBe(false)
    expect(decision.reasons).toContain('data_integrity_violations:1')
  })
})
