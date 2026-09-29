export type FypEvaluationEvent = {
  action: string
  actorId: string
  subjectType: 'need' | 'offer'
  subjectId: string
  occurredAt: string
  rankingVersion?: string | null
  rankPosition?: number | null
  score?: number | null
}

export type FypEvaluationMetrics = {
  impressions: number
  opens: number
  saves: number
  notInterested: number
  proposalsCreated: number
  proposalsAccepted: number
  exchangesCompleted: number
  feedbackSubmitted: number
  uniqueSubjects: number
  uniqueActors: number
  openRate: number
  saveRate: number
  notInterestedRate: number
  proposalRate: number
  acceptanceRate: number
  exchangeRate: number
  feedbackRate: number
  repeatExposureRate: number
  meanRankPosition: number | null
  meanScore: number | null
}

export type FypCandidateEvaluation = FypEvaluationMetrics & {
  rankingVersion: string
}

export type FypPromotionThresholds = {
  minimumImpressions: number
  minimumExchangeRateLift: number
  maximumNotInterestedRateIncrease: number
  maximumRepeatExposureRateIncrease: number
}

export type FypPromotionDecision = {
  eligible: boolean
  reasons: string[]
}

const divide = (numerator: number, denominator: number) => denominator > 0 ? numerator / denominator : 0
const round = (value: number) => Math.round(value * 10_000) / 10_000
const subjectKey = (event: FypEvaluationEvent) => `${event.actorId}:${event.subjectType}:${event.subjectId}`

export function attributeRankingVersions(events: FypEvaluationEvent[]): FypEvaluationEvent[] {
  const latestVersionBySubject = new Map<string, string>()
  return [...events]
    .sort((left, right) => new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime())
    .map((event) => {
      const key = subjectKey(event)
      if (event.rankingVersion) latestVersionBySubject.set(key, event.rankingVersion)
      const rankingVersion = event.rankingVersion ?? latestVersionBySubject.get(key) ?? null
      return { ...event, rankingVersion }
    })
}

export function evaluateFypEvents(events: FypEvaluationEvent[]): FypEvaluationMetrics {
  const count = (action: string) => events.filter((event) => event.action === action).length
  const impressions = events.filter((event) => event.action === 'fyp.impression')
  const opens = count('fyp.open')
  const saves = count('fyp.save')
  const notInterested = count('fyp.not_interested')
  const proposalsCreated = count('fyp.proposal_created')
  const proposalsAccepted = count('fyp.proposal_accepted')
  const exchangesCompleted = count('fyp.exchange_completed')
  const feedbackSubmitted = count('fyp.feedback_submitted')

  const exposureCounts = new Map<string, number>()
  for (const event of impressions) {
    const key = subjectKey(event)
    exposureCounts.set(key, (exposureCounts.get(key) ?? 0) + 1)
  }
  const repeatedImpressions = [...exposureCounts.values()].reduce((sum, value) => sum + Math.max(0, value - 1), 0)

  const rankPositions = impressions.flatMap((event) => typeof event.rankPosition === 'number' ? [event.rankPosition] : [])
  const scores = impressions.flatMap((event) => typeof event.score === 'number' ? [event.score] : [])

  return {
    impressions: impressions.length,
    opens,
    saves,
    notInterested,
    proposalsCreated,
    proposalsAccepted,
    exchangesCompleted,
    feedbackSubmitted,
    uniqueSubjects: new Set(impressions.map((event) => `${event.subjectType}:${event.subjectId}`)).size,
    uniqueActors: new Set(impressions.map((event) => event.actorId)).size,
    openRate: round(divide(opens, impressions.length)),
    saveRate: round(divide(saves, impressions.length)),
    notInterestedRate: round(divide(notInterested, impressions.length)),
    proposalRate: round(divide(proposalsCreated, impressions.length)),
    acceptanceRate: round(divide(proposalsAccepted, proposalsCreated)),
    exchangeRate: round(divide(exchangesCompleted, impressions.length)),
    feedbackRate: round(divide(feedbackSubmitted, exchangesCompleted)),
    repeatExposureRate: round(divide(repeatedImpressions, impressions.length)),
    meanRankPosition: rankPositions.length ? round(rankPositions.reduce((sum, value) => sum + value, 0) / rankPositions.length) : null,
    meanScore: scores.length ? round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : null,
  }
}

export function evaluateByRankingVersion(events: FypEvaluationEvent[]): FypCandidateEvaluation[] {
  const byVersion = new Map<string, FypEvaluationEvent[]>()
  for (const event of attributeRankingVersions(events)) {
    const version = event.rankingVersion ?? 'UNATTRIBUTED'
    const bucket = byVersion.get(version) ?? []
    bucket.push(event)
    byVersion.set(version, bucket)
  }
  return [...byVersion.entries()]
    .map(([rankingVersion, versionEvents]) => ({ rankingVersion, ...evaluateFypEvents(versionEvents) }))
    .sort((left, right) => left.rankingVersion.localeCompare(right.rankingVersion))
}

export function canPromoteFypCandidate(
  baseline: FypEvaluationMetrics,
  candidate: FypEvaluationMetrics,
  thresholds: FypPromotionThresholds = {
    minimumImpressions: 500,
    minimumExchangeRateLift: 0.05,
    maximumNotInterestedRateIncrease: 0,
    maximumRepeatExposureRateIncrease: 0,
  },
): FypPromotionDecision {
  const reasons: string[] = []
  if (candidate.impressions < thresholds.minimumImpressions) {
    reasons.push(`Candidate has ${candidate.impressions} impressions; ${thresholds.minimumImpressions} required.`)
  }

  const requiredExchangeRate = baseline.exchangeRate * (1 + thresholds.minimumExchangeRateLift)
  if (candidate.exchangeRate < requiredExchangeRate) {
    reasons.push(`Exchange rate ${candidate.exchangeRate} is below required ${round(requiredExchangeRate)}.`)
  }

  if (candidate.notInterestedRate > baseline.notInterestedRate + thresholds.maximumNotInterestedRateIncrease) {
    reasons.push('Not-interested rate regressed beyond the allowed threshold.')
  }

  if (candidate.repeatExposureRate > baseline.repeatExposureRate + thresholds.maximumRepeatExposureRateIncrease) {
    reasons.push('Repeat-exposure rate regressed beyond the allowed threshold.')
  }

  return { eligible: reasons.length === 0, reasons }
}
