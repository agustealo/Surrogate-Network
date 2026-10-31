import type { Json } from '@/infrastructure/supabase/database.types'

export type ConnectionMomentSummary = {
  status: string
  scheduled_time: string
}

export type ConnectionExchangeSummary = {
  id: string
  status: string
}

export type ConnectionNextStep = {
  heading: string
  description: string
  kind: 'feedback' | 'moment' | 'schedule' | 'inactive'
}

export function connectionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Active Connection',
    paused: 'Paused Connection',
    completed: 'Completed Connection',
    ended: 'Ended Connection',
  }
  return labels[status] ?? 'Connection status unavailable'
}

export function getConnectionNextStep(input: {
  status: string
  moments: ConnectionMomentSummary[]
  exchanges: ConnectionExchangeSummary[]
  reviewedExchangeIds: ReadonlySet<string>
}): ConnectionNextStep {
  const { status, moments, exchanges, reviewedExchangeIds } = input
  const needsFeedback = exchanges.some(
    exchange => (exchange.status === 'completed' || exchange.status === 'partial')
      && !reviewedExchangeIds.has(exchange.id),
  )
  if (needsFeedback) {
    return {
      kind: 'feedback',
      heading: 'Share feedback about your Exchange',
      description: 'A completed or partial Exchange is ready for your feedback below.',
    }
  }

  if (status !== 'active') {
    return {
      kind: 'inactive',
      heading: connectionStatusLabel(status),
      description: 'This Connection is not currently active. Review its history below. Scheduling is available only for active Connections.',
    }
  }

  const upcoming = moments
    .filter(moment => moment.status === 'scheduled' || moment.status === 'in_progress')
    .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))[0]
  if (upcoming) {
    return {
      kind: 'moment',
      heading: upcoming.status === 'in_progress' ? 'Your Moment is in progress' : 'You have a scheduled Moment',
      description: 'Review the Moment details and available actions below before continuing.',
    }
  }

  return {
    kind: 'schedule',
    heading: 'Plan your next Moment',
    description: 'This Connection is active. You can propose the next scheduled interaction below.',
  }
}

export type ConnectionAgreementDisplay = {
  boundaries: string[]
  expectations: string[]
  communicationMethod: string | null
}

export function displayConnectionAgreement(agreement: Json): ConnectionAgreementDisplay | null {
  if (!agreement || typeof agreement !== 'object' || Array.isArray(agreement)) return null

  const strings = (value: Json | undefined): string[] =>
    Array.isArray(value)
      ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      : []

  const boundaries = strings(agreement.boundaries)
  const expectations = strings(agreement.expectations)
  const communicationMethod =
    typeof agreement.communicationMethod === 'string' && agreement.communicationMethod.trim()
      ? agreement.communicationMethod
      : null

  return boundaries.length || expectations.length || communicationMethod
    ? { boundaries, expectations, communicationMethod }
    : null
}
