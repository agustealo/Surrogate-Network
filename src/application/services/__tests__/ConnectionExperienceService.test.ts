import { connectionStatusLabel, displayConnectionAgreement, getConnectionNextStep } from '../ConnectionExperienceService'

const base = {
  status: 'active',
  moments: [] as { status: string; scheduled_time: string }[],
  exchanges: [] as { id: string; status: string }[],
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
    const exchanges = [{ id: 'exchange-1', status: 'completed' }, { id: 'exchange-2', status: 'disputed' }]
    expect(getConnectionNextStep({ ...base, exchanges }).kind).toBe('feedback')
    expect(getConnectionNextStep({ ...base, exchanges, reviewedExchangeIds: new Set(['exchange-1']) }).kind).toBe('schedule')
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
