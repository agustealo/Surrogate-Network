import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from '@jest/globals'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

type Principal = {
  user: User
  email: string
  password: string
}

describe('Consumer safety visibility and deactivation boundaries', () => {
  let url: string
  let anonKey: string
  let serviceKey: string
  let service: SupabaseClient
  let memberA: Principal
  let memberB: Principal
  let memberC: Principal

  async function createPrincipal(label: string): Promise<Principal> {
    const suffix = randomUUID()
    const emailLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const email = `${emailLabel}-${suffix}@test.local`
    const password = `Safety-${suffix}-Aa1!`
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

    memberA = await createPrincipal('Safety Member A')
    memberB = await createPrincipal('Safety Member B')
    memberC = await createPrincipal('Safety Member C')
  })

  it('suppresses mutually blocked profiles and prevents unrelated block-state probing', async () => {
    const clientA = await clientFor(memberA)
    const clientB = await clientFor(memberB)
    const clientC = await clientFor(memberC)

    const { error: blockError } = await clientA.from('blocks').insert({
      blocker_user_id: memberA.user.id,
      blocked_user_id: memberB.user.id,
    })
    expect(blockError).toBeNull()

    const [aSeesB, bSeesA] = await Promise.all([
      clientA.from('public_profiles').select('id').eq('id', memberB.user.id).maybeSingle(),
      clientB.from('public_profiles').select('id').eq('id', memberA.user.id).maybeSingle(),
    ])

    expect(aSeesB.error).toBeNull()
    expect(aSeesB.data).toBeNull()
    expect(bSeesA.error).toBeNull()
    expect(bSeesA.data).toBeNull()

    const ownPair = await clientA.rpc('are_users_blocked', {
      p_user_a: memberA.user.id,
      p_user_b: memberB.user.id,
    })
    expect(ownPair.error).toBeNull()
    expect(ownPair.data).toBe(true)

    const unrelatedPair = await clientC.rpc('are_users_blocked', {
      p_user_a: memberA.user.id,
      p_user_b: memberB.user.id,
    })
    expect(unrelatedPair.error).toBeTruthy()
  })

  it('deactivation removes active marketplace exposure and blocks new relationship activity', async () => {
    const [{ data: needA, error: needAError }, { data: offerA, error: offerAError }, { data: offerC, error: offerCError }, { data: needC, error: needCError }] = await Promise.all([
      service.from('needs').insert({
        title: 'Deactivation Need A',
        description: 'Active need that must leave discovery when its owner deactivates.',
        category: 'personal',
        location_mode: 'remote',
        boundaries: ['platonic'],
        status: 'active',
        user_id: memberA.user.id,
        user_name: 'Safety Member A',
      }).select('id').single(),
      service.from('offers').insert({
        title: 'Deactivation Offer A',
        description: 'Active offer that must leave discovery when its owner deactivates.',
        category: 'personal',
        location_mode: 'remote',
        boundaries: ['platonic'],
        status: 'active',
        user_id: memberA.user.id,
        user_name: 'Safety Member A',
      }).select('id').single(),
      service.from('offers').insert({
        title: 'Counterparty Offer C',
        description: 'Counterparty offer used to prove proposal cleanup on deactivation.',
        category: 'personal',
        location_mode: 'remote',
        boundaries: ['platonic'],
        status: 'active',
        user_id: memberC.user.id,
        user_name: 'Safety Member C',
      }).select('id').single(),
      service.from('needs').insert({
        title: 'Counterparty Need C',
        description: 'Counterparty need used to prove relationship activity is blocked.',
        category: 'personal',
        location_mode: 'remote',
        boundaries: ['platonic'],
        status: 'active',
        user_id: memberC.user.id,
        user_name: 'Safety Member C',
      }).select('id').single(),
    ])

    if (needAError || !needA) throw needAError ?? new Error('Unable to seed member A need')
    if (offerAError || !offerA) throw offerAError ?? new Error('Unable to seed member A offer')
    if (offerCError || !offerC) throw offerCError ?? new Error('Unable to seed member C offer')
    if (needCError || !needC) throw needCError ?? new Error('Unable to seed member C need')

    const [{ data: proposal, error: proposalError }, { data: surrogacy, error: surrogacyError }] = await Promise.all([
      service.from('proposals').insert({
        need_id: needA.id,
        offer_id: offerC.id,
        proposing_user_id: memberA.user.id,
        receiving_user_id: memberC.user.id,
        status: 'pending',
      }).select('id').single(),
      service.from('surrogacies').insert({
        need_id: needC.id,
        offer_id: offerA.id,
        partner_ids: [memberA.user.id, memberC.user.id],
        status: 'active',
        agreement: { source: 'consumer-safety-regression' },
      }).select('id').single(),
    ])

    if (proposalError || !proposal) throw proposalError ?? new Error('Unable to seed open proposal')
    if (surrogacyError || !surrogacy) throw surrogacyError ?? new Error('Unable to seed relationship')

    const clientA = await clientFor(memberA)
    const deactivate = await clientA.rpc('set_trial_account_participation', { p_active: false })
    expect(deactivate.error).toBeNull()

    const [profile, need, offer, proposalState, counterpartyOffer] = await Promise.all([
      service.from('profiles').select('trial_deactivated_at').eq('id', memberA.user.id).single(),
      service.from('needs').select('status').eq('id', needA.id).single(),
      service.from('offers').select('status').eq('id', offerA.id).single(),
      service.from('proposals').select('status').eq('id', proposal.id).single(),
      service.from('offers').select('status').eq('id', offerC.id).single(),
    ])

    expect(profile.data?.trial_deactivated_at).toBeTruthy()
    expect(need.data?.status).toBe('paused')
    expect(offer.data?.status).toBe('paused')
    expect(proposalState.data?.status).toBe('withdrawn')
    expect(counterpartyOffer.data?.status).toBe('active')

    const clientC = await clientFor(memberC)
    const publicProfile = await clientC
      .from('public_profiles')
      .select('id')
      .eq('id', memberA.user.id)
      .maybeSingle()
    expect(publicProfile.error).toBeNull()
    expect(publicProfile.data).toBeNull()

    const momentAttempt = await service.from('moments').insert({
      surrogacy_id: surrogacy.id,
      scheduled_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      duration: 30,
      status: 'scheduled',
      location: 'Video call',
    })
    expect(momentAttempt.error).toBeTruthy()
  })
})
