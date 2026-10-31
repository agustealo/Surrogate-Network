import { selectHomeActions, type HomeProposal, type HomeConnection, type HomeMoment, type HomeExchange } from '../HomeNextActionService'

const userId = 'member-one'
const connection: HomeConnection = { id: 'connection-a', status: 'active', started_at: '2026-10-20T12:00:00Z' }
const moment: HomeMoment = { id: 'moment-a', surrogacy_id: connection.id, status: 'scheduled', scheduled_time: '2026-11-02T15:00:00Z' }
const exchange: HomeExchange = { id: 'exchange-a', surrogacy_id: connection.id, status: 'completed', completed_at: '2026-10-25T15:00:00Z' }

function project(options: {
  proposals?: HomeProposal[]
  connections?: HomeConnection[]
  moments?: HomeMoment[]
  exchanges?: HomeExchange[]
  reviewed?: string[]
} = {}) {
  return selectHomeActions({
    userId,
    proposals: options.proposals ?? [],
    connections: options.connections ?? [],
    moments: options.moments ?? [],
    exchanges: options.exchanges ?? [],
    reviewedExchangeIds: new Set(options.reviewed ?? []),
  })
}

describe('Home next-action projection', () => {
  const pending: HomeProposal = {
    id: 'proposal-a', status: 'pending', proposing_user_id: 'member-two',
    receiving_user_id: userId, countered_by_user_id: null, created_at: '2026-10-26T12:00:00Z',
  }

  it('never promotes an outgoing pending proposal as a reply request', () => {
    expect(project({ proposals: [{ ...pending, proposing_user_id: userId, receiving_user_id: 'member-two' }] })).toEqual([])
  })

  it('prioritizes an incoming proposal over feedback and scheduled Moments', () => {
    const result = project({ proposals: [pending], connections: [connection], moments: [moment], exchanges: [exchange] })
    expect(result.map(item => item.key)).toEqual(['proposal:proposal-a', 'feedback:exchange-a', 'moment:moment-a'])
  })

  it('only offers a counterproposal decision to the participant who did not counter', () => {
    const countered = { ...pending, status: 'countered', countered_by_user_id: 'member-two' }
    expect(project({ proposals: [countered] }).map(a => a.key)).toEqual(['proposal:proposal-a'])
    expect(project({ proposals: [{ ...countered, countered_by_user_id: userId }] })).toEqual([])
  })

  it('does not ask for feedback twice or on disputed exchanges', () => {
    expect(project({ connections: [connection], exchanges: [exchange], reviewed: [exchange.id] }).some(a => a.key.startsWith('feedback:'))).toBe(false)
    expect(project({ connections: [connection], exchanges: [{ ...exchange, status: 'disputed' }] }).some(a => a.key.startsWith('feedback:'))).toBe(false)
  })

  it('suggests scheduling only when no active scheduled or in-progress Moment exists', () => {
    expect(project({ connections: [connection] }).map(a => a.key)).toEqual(['connection:connection-a'])
    expect(project({ connections: [connection], moments: [moment] }).map(a => a.key)).toEqual(['moment:moment-a'])
    expect(project({ connections: [connection], moments: [{ ...moment, status: 'in_progress' }] }).map(a => a.key)).toEqual(['moment:moment-a'])
  })

  it('never surfaces inactive relationships, expired proposal states, or foreign Moment references', () => {
    const result = project({
      proposals: [{ ...pending, status: 'declined' }],
      connections: [{ ...connection, status: 'ended' }],
      moments: [moment, { ...moment, id: 'other', surrogacy_id: 'foreign' }],
      exchanges: [exchange],
    })
    expect(result).toEqual([])
  })

  it('uses stable keys and deterministic time-based ordering', () => {
    const result = project({ connections: [connection], moments: [
      moment, { ...moment, id: 'moment-b', scheduled_time: '2026-11-01T12:00:00Z' },
    ] })
    expect(result.map(a => a.key)).toEqual(['moment:moment-b', 'moment:moment-a'])
  })
})
