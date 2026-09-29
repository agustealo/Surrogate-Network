import {
  canPromoteFypCandidate,
  evaluateByRankingVersion,
  evaluateFypEvents,
  type FypEvaluationEvent,
} from '@/domain/recommendations/evaluation'

const event = (overrides: Partial<FypEvaluationEvent>): FypEvaluationEvent => ({
  action: 'fyp.impression',
  actorId: '00000000-0000-0000-0000-000000000001',
  subjectType: 'need',
  subjectId: '00000000-0000-0000-0000-000000000010',
  occurredAt: '2026-09-29T12:00:00.000Z',
  rankingVersion: 'FYP_BASELINE_V1',
  rankPosition: 0,
  score: 80,
  ...overrides,
})

describe('FYP evaluation', () => {
  it('computes a complete conversion funnel without dividing by zero', () => {
    const events: FypEvaluationEvent[] = [
      event({}),
      event({ subjectId: '00000000-0000-0000-0000-000000000011', rankPosition: 1, score: 70 }),
      event({ action: 'fyp.open' }),
      event({ action: 'fyp.save' }),
      event({ action: 'fyp.proposal_created' }),
      event({ action: 'fyp.proposal_accepted' }),
      event({ action: 'fyp.exchange_completed' }),
      event({ action: 'fyp.feedback_submitted' }),
    ]

    const metrics = evaluateFypEvents(events)
    expect(metrics).toMatchObject({
      impressions: 2,
      opens: 1,
      saves: 1,
      proposalsCreated: 1,
      proposalsAccepted: 1,
      exchangesCompleted: 1,
      feedbackSubmitted: 1,
      openRate: 0.5,
      saveRate: 0.5,
      proposalRate: 0.5,
      acceptanceRate: 1,
      exchangeRate: 0.5,
      feedbackRate: 1,
      meanRankPosition: 0.5,
      meanScore: 75,
    })
  })

  it('measures repeated exposure per viewer and subject', () => {
    const metrics = evaluateFypEvents([
      event({}),
      event({}),
      event({}),
      event({ subjectId: '00000000-0000-0000-0000-000000000011' }),
    ])
    expect(metrics.repeatExposureRate).toBe(0.5)
  })

  it('keeps ranking versions separated for offline replay comparison', () => {
    const results = evaluateByRankingVersion([
      event({ rankingVersion: 'FYP_BASELINE_V1' }),
      event({ rankingVersion: 'FYP_CANDIDATE_V2' }),
      event({ rankingVersion: 'FYP_CANDIDATE_V2', subjectId: '00000000-0000-0000-0000-000000000012' }),
    ])
    expect(results).toEqual([
      expect.objectContaining({ rankingVersion: 'FYP_BASELINE_V1', impressions: 1 }),
      expect.objectContaining({ rankingVersion: 'FYP_CANDIDATE_V2', impressions: 2 }),
    ])
  })

  it('fails closed when a candidate has insufficient evidence or quality regressions', () => {
    const baseline = evaluateFypEvents([
      ...Array.from({ length: 100 }, (_, index) => event({ subjectId: `00000000-0000-0000-0000-${String(index).padStart(12, '0')}` })),
      ...Array.from({ length: 10 }, () => event({ action: 'fyp.exchange_completed' })),
      ...Array.from({ length: 5 }, () => event({ action: 'fyp.not_interested' })),
    ])
    const candidate = evaluateFypEvents([
      ...Array.from({ length: 50 }, (_, index) => event({ rankingVersion: 'FYP_CANDIDATE_V2', subjectId: `10000000-0000-0000-0000-${String(index).padStart(12, '0')}` })),
      event({ action: 'fyp.exchange_completed', rankingVersion: 'FYP_CANDIDATE_V2' }),
      ...Array.from({ length: 10 }, () => event({ action: 'fyp.not_interested', rankingVersion: 'FYP_CANDIDATE_V2' })),
    ])

    const decision = canPromoteFypCandidate(baseline, candidate, {
      minimumImpressions: 100,
      minimumExchangeRateLift: 0.05,
      maximumNotInterestedRateIncrease: 0,
      maximumRepeatExposureRateIncrease: 0,
    })
    expect(decision.eligible).toBe(false)
    expect(decision.reasons.length).toBeGreaterThanOrEqual(2)
  })

  it('allows promotion only when evidence and guardrails are satisfied', () => {
    const baseline = evaluateFypEvents([
      ...Array.from({ length: 100 }, (_, index) => event({ subjectId: `20000000-0000-0000-0000-${String(index).padStart(12, '0')}` })),
      ...Array.from({ length: 10 }, () => event({ action: 'fyp.exchange_completed' })),
      ...Array.from({ length: 5 }, () => event({ action: 'fyp.not_interested' })),
    ])
    const candidate = evaluateFypEvents([
      ...Array.from({ length: 100 }, (_, index) => event({ rankingVersion: 'FYP_CANDIDATE_V2', subjectId: `30000000-0000-0000-0000-${String(index).padStart(12, '0')}` })),
      ...Array.from({ length: 12 }, () => event({ action: 'fyp.exchange_completed', rankingVersion: 'FYP_CANDIDATE_V2' })),
      ...Array.from({ length: 4 }, () => event({ action: 'fyp.not_interested', rankingVersion: 'FYP_CANDIDATE_V2' })),
    ])

    expect(canPromoteFypCandidate(baseline, candidate, {
      minimumImpressions: 100,
      minimumExchangeRateLift: 0.05,
      maximumNotInterestedRateIncrease: 0,
      maximumRepeatExposureRateIncrease: 0,
    })).toEqual({ eligible: true, reasons: [] })
  })
})
