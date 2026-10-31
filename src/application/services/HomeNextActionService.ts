import { routes } from '@/lib/routes'

export type HomeAction = {
  key: string
  title: string
  description: string
  href: string
  label: string
  priority: number
  sortAt: string
}

export type HomeProposal = {
  id: string
  status: string | null
  proposing_user_id: string
  receiving_user_id: string
  countered_by_user_id: string | null
  created_at: string | null
}

export type HomeConnection = {
  id: string
  status: string | null
  started_at: string | null
}

export type HomeMoment = {
  id: string
  surrogacy_id: string
  status: string | null
  scheduled_time: string
}

export type HomeExchange = {
  id: string
  surrogacy_id: string
  status: string | null
  completed_at: string | null
}

export function selectHomeActions(input: {
  userId: string
  proposals: HomeProposal[]
  connections: HomeConnection[]
  moments: HomeMoment[]
  exchanges: HomeExchange[]
  reviewedExchangeIds: ReadonlySet<string>
}): HomeAction[] {
  const { userId, proposals, connections, moments, exchanges, reviewedExchangeIds } = input
  const activeIds = new Set(connections.filter(item => item.status === 'active').map(item => item.id))
  const result: HomeAction[] = []

  for (const proposal of proposals) {
    const canRespond = proposal.status === 'pending'
      ? proposal.receiving_user_id === userId
      : proposal.status === 'countered'
        && (proposal.proposing_user_id === userId || proposal.receiving_user_id === userId)
        && proposal.countered_by_user_id !== userId

    if (!canRespond) continue
    result.push({
      key: `proposal:${proposal.id}`,
      title: proposal.status === 'countered' ? 'A counterproposal needs your decision' : 'Respond to a proposal',
      description: 'Review the proposed terms before choosing how to respond.',
      href: routes.member.proposals,
      label: 'Review proposal',
      priority: 0,
      sortAt: proposal.created_at ?? '',
    })
  }

  for (const exchange of exchanges) {
    if (!activeIds.has(exchange.surrogacy_id)) continue
    if (!['completed', 'partial'].includes(exchange.status ?? '') || reviewedExchangeIds.has(exchange.id)) continue
    result.push({
      key: `feedback:${exchange.id}`,
      title: 'Share feedback on an exchange',
      description: 'Reflect on your completed or partial exchange.',
      href: routes.memberDynamic.surrogacy(exchange.surrogacy_id),
      label: 'Leave feedback',
      priority: 1,
      sortAt: exchange.completed_at ?? '',
    })
  }

  const scheduledConnectionIds = new Set<string>()
  for (const moment of moments) {
    if (!activeIds.has(moment.surrogacy_id) || !['scheduled', 'in_progress'].includes(moment.status ?? '')) continue
    scheduledConnectionIds.add(moment.surrogacy_id)
    result.push({
      key: `moment:${moment.id}`,
      title: moment.status === 'in_progress' ? 'Continue your Moment' : 'Your scheduled Moment',
      description: moment.status === 'in_progress'
        ? 'Review this Moment and its available next steps.'
        : 'Review the planned time and your participation details.',
      href: routes.memberDynamic.surrogacy(moment.surrogacy_id),
      label: 'View Moment',
      priority: 2,
      sortAt: moment.scheduled_time,
    })
  }

  for (const connection of connections) {
    if (!activeIds.has(connection.id) || scheduledConnectionIds.has(connection.id)) continue
    result.push({
      key: `connection:${connection.id}`,
      title: 'Plan a Moment with your Connection',
      description: 'Your Connection is active and has no currently scheduled Moment.',
      href: routes.memberDynamic.surrogacy(connection.id),
      label: 'Open Connection',
      priority: 3,
      sortAt: connection.started_at ?? '',
    })
  }

  return result.sort((a, b) => a.priority - b.priority || (
    a.priority === 2
      ? a.sortAt.localeCompare(b.sortAt)
      : b.sortAt.localeCompare(a.sortAt)
  ) || a.key.localeCompare(b.key))
}
