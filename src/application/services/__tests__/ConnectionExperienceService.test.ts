import { connectionStatusLabel, displayConnectionAgreement, getConnectionNextStep } from '../ConnectionExperienceService'

const base = {
  status: 'active',
  viewerId: 'member-1',
  moments: [] as { status: string; scheduled_time: string }[],
  exchanges: [] as { id: string; status: string; confirmation_state?: string; recorded_by?: string }[],
  reviewedExchangeIds: new Set<string>(),
}

describe('Connection experience projection', () => {
  it('distinguishes active, paused, completed and ended relationship states', () => {
    expect(connectionStatusLabel('active')).toBe('Active Connection')
    expect(connectionStatusLabel('paused')).toBe('Paused Connection')
    expect(connectionStatusLabel('completed')).toBe('Completed Connection')
    expect(connectionStatusLabel('ended')).toBe('Ended Connection')
    expect(connectionStatusLabel('unknown')).toBe('Connection status unavailable')
  })

  it('offers scheduling for active connections without an active Moment', () => {
    expect(getConnectionNextStep(base).kind).toBe('schedule')
  })

  it('uses existing scheduled and in-progress Moments without inventing an action', () => {
    expect(getConnectionNextStep({ ...base, moments: [
      { status: 'cancelled', scheduled_time: '2026-10-30T10:00:00Z' },
      { status: 'scheduled', scheduled_time: '2026-11-02T10:00:00Z' },
    ] }).kind).toBe('moment')
    expect(getConnectionNextStep({ ...base, moments: [{ status: 'in_progress', scheduled_time: '2026-11-02T10:00:00Z' }] }).heading).toBe('Your Moment is in progress')
  })

  it('prioritizes eligible feedback but excludes already reviewed and disputed Exchanges', () => {
    const exchanges = [{ id: 'exchange-1', status: 'completed', confirmation_state: 'confirmed' }, { id: 'exchange-2', status: 'disputed' }]
    expect(getConnectionNextStep({ ...base, exchanges }).kind).toBe('feedback')
    expect(getConnectionNextStep({ ...base, exchanges, reviewedExchangeIds: new Set(['exchange-1']) }).kind).toBe('schedule')
  })

  it('gives the non-reporting participant a clear confirmation action', () => {
    const pending = [{ id: 'exchange-3', status: 'completed', confirmation_state: 'pending', recorded_by: 'member-2' }]
    const step = getConnectionNextStep({ ...base, exchanges: pending })
    expect(step.kind).toBe('confirmation')
    expect(step.heading).toBe('Confirm a reported Exchange')
    expect(step.description).toMatch(/confirm or dispute/i)
  })

  it('tells the reporting participant to await their peer rather than self-confirm', () => {
    const pending = [{ id: 'exchange-3', status: 'partial', confirmation_state: 'pending', recorded_by: 'member-1' }]
    const step = getConnectionNextStep({ ...base, exchanges: pending })
    expect(step.kind).toBe('confirmation')
    expect(step.heading).toBe('Waiting for the other participant')
    expect(step.description).toMatch(/other participant must confirm or dispute/i)
  })

  it('prioritizes actionable confirmed feedback over waiting for a separate Exchange', () => {
    const exchanges = [
      { id: 'exchange-3', status: 'completed', confirmation_state: 'pending', recorded_by: 'member-1' },
      { id: 'exchange-4', status: 'completed', confirmation_state: 'confirmed', recorded_by: 'member-2' },
    ]
    expect(getConnectionNextStep({ ...base, exchanges }).kind).toBe('feedback')
  })

  it('does not offer confirmation of a legacy unverified Exchange', () => {
    const legacy = [{ id: 'exchange-3', status: 'completed', confirmation_state: 'legacy_unverified' }]
    expect(getConnectionNextStep({ ...base, exchanges: legacy }).kind).toBe('schedule')
  })

  it('never offers scheduling on a nonactive connection', () => {
    for (const status of ['paused', 'ended', 'completed']) {
      expect(getConnectionNextStep({ ...base, status }).kind).toBe('inactive')
    }
  })

  it('renders only explicitly recorded agreement fields', () => {
    expect(displayConnectionAgreement(null)).toBeNull()
    expect(displayConnectionAgreement('not-an-agreement')).toBeNull()
    expect(displayConnectionAgreement({ random: 'value' })).toBeNull()
    expect(displayConnectionAgreement({
      boundaries: ['platonic', 5, 'virtual', ''],
      expectations: ['Arrive on time'],
      communicationMethod: 'Through agreed channel',
    })).toEqual({
      boundaries: ['platonic', 'virtual'],
      expectations: ['Arrive on time'],
      communicationMethod: 'Through agreed channel',
    })
  })
})
