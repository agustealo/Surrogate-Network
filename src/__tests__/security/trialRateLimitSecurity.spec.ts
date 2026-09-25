import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from '@jest/globals'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

type Principal = {
  user: User
  email: string
  password: string
}

describe('Trial action rate-limit security', () => {
  let url: string
  let anonKey: string
  let serviceKey: string
  let service: SupabaseClient
  let memberA: Principal
  let memberB: Principal

  async function createPrincipal(label: string): Promise<Principal> {
    const suffix = randomUUID()
    const emailLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const email = `${emailLabel}-${suffix}@test.local`
    const password = `Rate-${suffix}-Aa1!`
    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: label },
    })
    if (error || !data.user) throw error ?? new Error(`Unable to create ${label}`)
    return { user: data.user, email, password }
  }

  async function clientFor(principal: Principal): Promise<SupabaseClient> {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error } = await client.auth.signInWithPassword({
      email: principal.email,
      password: principal.password,
    })
    if (error) throw error
    return client
  }

  beforeAll(async () => {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    if (!url || !anonKey || !serviceKey) throw new Error('Local Supabase credentials are required')

    service = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    memberA = await createPrincipal('Rate Member A')
    memberB = await createPrincipal('Rate Member B')
  })

  it('does not expose the budget mutator as a member RPC', async () => {
    const clientA = await clientFor(memberA)
    const { error } = await clientA.rpc('consume_trial_action_budget', {
      p_user_id: memberA.user.id,
      p_action_key: 'need_create',
      p_limit: 999,
      p_window: '1 hour',
    })
    expect(error).toBeTruthy()
  })

  it('serializes concurrent Need and Offer creation at their hourly ceilings', async () => {
    const clientA = await clientFor(memberA)

    const needAttempts = await Promise.all(
      Array.from({ length: 13 }, (_, index) => clientA.from('needs').insert({
        title: `Rate Need ${index}`,
        description: `Concurrent Need creation attempt ${index} for database rate-limit proof.`,
        category: 'personal',
        location_mode: 'remote',
        boundaries: ['platonic'],
        user_id: memberA.user.id,
        user_name: 'Rate Member A',
      }))
    )

    expect(needAttempts.filter((result) => !result.error)).toHaveLength(12)
    expect(needAttempts.filter((result) => result.error)).toHaveLength(1)

    const offerAttempts = await Promise.all(
      Array.from({ length: 13 }, (_, index) => clientA.from('offers').insert({
        title: `Rate Offer ${index}`,
        description: `Concurrent Offer creation attempt ${index} for database rate-limit proof.`,
        category: 'personal',
        location_mode: 'remote',
        boundaries: ['platonic'],
        user_id: memberA.user.id,
        user_name: 'Rate Member A',
      }))
    )

    expect(offerAttempts.filter((result) => !result.error)).toHaveLength(12)
    expect(offerAttempts.filter((result) => result.error)).toHaveLength(1)
  })

  it('enforces independent Proposal and Report budgets', async () => {
    const [{ data: needB, error: needError }, { data: offerA, error: offerError }] = await Promise.all([
      service.from('needs').insert({
        title: 'Rate Proposal Need B',
        description: 'Counterparty Need used to exercise proposal rate limiting.',
        category: 'personal',
        location_mode: 'remote',
        boundaries: ['platonic'],
        status: 'active',
        user_id: memberB.user.id,
        user_name: 'Rate Member B',
      }).select('id').single(),
      service.from('offers').insert({
        title: 'Rate Proposal Offer A',
        description: 'Member Offer used to exercise proposal rate limiting.',
        category: 'personal',
        location_mode: 'remote',
        boundaries: ['platonic'],
        status: 'active',
        user_id: memberA.user.id,
        user_name: 'Rate Member A',
      }).select('id').single(),
    ])

    if (needError || !needB) throw needError ?? new Error('Unable to seed proposal Need')
    if (offerError || !offerA) throw offerError ?? new Error('Unable to seed proposal Offer')

    const clientA = await clientFor(memberA)
    const proposalAttempts = await Promise.all(
      Array.from({ length: 31 }, () => clientA.from('proposals').insert({
        need_id: needB.id,
        offer_id: offerA.id,
        proposing_user_id: memberA.user.id,
        receiving_user_id: memberB.user.id,
      }).select('id,status').single())
    )

    const successfulProposals = proposalAttempts.filter((result) => !result.error)
    expect(successfulProposals).toHaveLength(30)
    expect(proposalAttempts.filter((result) => result.error)).toHaveLength(1)
    expect(successfulProposals.every((result) => result.data?.status === 'pending')).toBe(true)

    const reportAttempts = await Promise.all(
      Array.from({ length: 11 }, (_, index) => clientA.from('reports').insert({
        reporter_user_id: memberA.user.id,
        reported_user_id: memberB.user.id,
        type: 'other',
        severity: 'low',
        description: `Rate-limit report fixture ${index} with enough detail for validation.`,
      }).select('id,status').single())
    )

    const successfulReports = reportAttempts.filter((result) => !result.error)
    expect(successfulReports).toHaveLength(10)
    expect(reportAttempts.filter((result) => result.error)).toHaveLength(1)
    expect(successfulReports.every((result) => result.data?.status === 'pending')).toBe(true)
  })

  it('keeps budgets per-member and does not throttle trusted service work', async () => {
    const clientB = await clientFor(memberB)
    const memberBWrite = await clientB.from('needs').insert({
      title: 'Independent Member Need',
      description: 'Another member retains an independent trial action budget.',
      category: 'personal',
      location_mode: 'remote',
      boundaries: ['platonic'],
      user_id: memberB.user.id,
      user_name: 'Rate Member B',
    })
    expect(memberBWrite.error).toBeNull()

    const serviceWrite = await service.from('needs').insert({
      title: 'Trusted Service Need',
      description: 'Trusted system work remains outside authenticated member budgets.',
      category: 'personal',
      location_mode: 'remote',
      boundaries: ['platonic'],
      status: 'active',
      user_id: memberA.user.id,
      user_name: 'Rate Member A',
    })
    expect(serviceWrite.error).toBeNull()
  })
})