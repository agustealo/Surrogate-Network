import { beforeAll, describe, expect, it } from '@jest/globals'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Principal = {
  id: string
  email: string
  password: string
}

describe('SN-ENG-01 nonmonetary reward authority', () => {
  let service: SupabaseClient
  let memberClient: SupabaseClient
  let member: Principal
  let partner: Principal
  let exchangeId: string
  let firstAwardId: string

  beforeAll(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    if (!url || !anonKey || !serviceRoleKey) {
      throw new Error('Reward authority tests require local Supabase credentials')
    }

    service = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const createPrincipal = async (name: string): Promise<Principal> => {
      const suffix = Date.now().toString() + '-' + Math.random().toString(16).slice(2)
      const email = name + '-' + suffix + '@test.local'
      const password = 'Reward-' + suffix + '-A9!'
      const { data, error } = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (error || !data.user) throw error ?? new Error('Could not create test member')
      return { id: data.user.id, email, password }
    }

    member = await createPrincipal('reward-member')
    partner = await createPrincipal('reward-partner')

    memberClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error: signInError } = await memberClient.auth.signInWithPassword({
      email: member.email,
      password: member.password,
    })
    if (signInError) throw signInError

    const [needResult, offerResult] = await Promise.all([
      service.from('needs').insert({
        title: 'Reward proof Need',
        description: 'Verify an authentic completed Exchange feedback reward.',
        category: 'personal',
        user_id: member.id,
        user_name: 'Reward Member',
        boundaries: ['platonic'],
        location_mode: 'remote',
        status: 'active',
      }).select('id').single(),
      service.from('offers').insert({
        title: 'Reward proof Offer',
        description: 'Offer paired with the reward proof Need.',
        category: 'personal',
        user_id: partner.id,
        user_name: 'Reward Partner',
        boundaries: ['platonic'],
        location_mode: 'remote',
        status: 'active',
        capacity: 2,
        current_capacity: 0,
      }).select('id').single(),
    ])
    if (needResult.error || !needResult.data) {
      throw needResult.error ?? new Error('Could not create proof Need')
    }
    if (offerResult.error || !offerResult.data) {
      throw offerResult.error ?? new Error('Could not create proof Offer')
    }

    const { data: connection, error: connectionError } = await service
      .from('surrogacies')
      .insert({
        need_id: needResult.data.id,
        offer_id: offerResult.data.id,
        partner_ids: [member.id, partner.id],
        status: 'active',
      })
      .select('id')
      .single()
    if (connectionError || !connection) {
      throw connectionError ?? new Error('Could not create proof Connection')
    }

    const { data: moment, error: momentError } = await service
      .from('moments')
      .insert({
        surrogacy_id: connection.id,
        scheduled_time: new Date(Date.now() - 60_000).toISOString(),
        duration: 30,
        status: 'completed',
      })
      .select('id')
      .single()
    if (momentError || !moment) {
      throw momentError ?? new Error('Could not create proof Moment')
    }

    const { data: exchange, error: exchangeError } = await service
      .from('exchanges')
      .insert({
        moment_id: moment.id,
        surrogacy_id: connection.id,
        status: 'completed',
      })
      .select('id')
      .single()
    if (exchangeError || !exchange) {
      throw exchangeError ?? new Error('Could not create proof Exchange')
    }
    exchangeId = exchange.id
  })

  it('starts with the existing journal and synchronized zero progression', async () => {
    const { data: profile, error: profileError } = await service
      .from('profiles')
      .select('xp,rank')
      .eq('id', member.id)
      .single()
    expect(profileError).toBeNull()
    expect(profile).toMatchObject({ xp: 0, rank: 1 })

    const { data: ledger, error: ledgerError } = await service
      .from('xp_transactions')
      .select('id')
      .eq('user_id', member.id)
    expect(ledgerError).toBeNull()
    expect(ledger).toHaveLength(0)
  })

  it('awards 10 XP after eligible participant feedback regardless of rating', async () => {
    const { data, error } = await memberClient.rpc('submit_feedback_for_trial', {
      p_exchange_id: exchangeId,
      p_to_user_id: partner.id,
      p_rating: 2,
      p_breakdown: {},
      p_comments: 'Completed and reviewed with honest feedback.',
      p_skill_endorsements: [],
    })
    expect(error).toBeNull()
    expect(data).toEqual(expect.any(String))
    firstAwardId = data as string

    const { data: entries, error: entriesError } = await service
      .from('xp_transactions')
      .select('id,amount,source,description')
      .eq('user_id', member.id)
    expect(entriesError).toBeNull()
    expect(entries).toHaveLength(1)
    expect(entries?.[0]).toMatchObject({ amount: 10, source: 'feedback' })

    const [profile, progression] = await Promise.all([
      service.from('profiles').select('xp,rank').eq('id', member.id).single(),
      memberClient.from('member_progression')
        .select('total_xp,current_rank,level').eq('user_id', member.id).single(),
    ])
    expect(profile.error).toBeNull()
    expect(progression.error).toBeNull()
    expect(profile.data).toMatchObject({ xp: 10, rank: 1 })
    expect(progression.data).toMatchObject({ total_xp: 10, current_rank: 1, level: 1 })
  })

  it('is idempotent when feedback submission is retried', async () => {
    const { data, error } = await memberClient.rpc('submit_feedback_for_trial', {
      p_exchange_id: exchangeId,
      p_to_user_id: partner.id,
      p_rating: 2,
      p_breakdown: {},
      p_comments: 'A repeat request must not pay XP twice.',
      p_skill_endorsements: [],
    })
    expect(error).toBeNull()
    expect(data).toBe(firstAwardId)

    const { data: entries, error: ledgerError } = await service
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', member.id)
      .eq('source', 'feedback')
    expect(ledgerError).toBeNull()
    expect(entries).toHaveLength(1)
    expect(entries?.[0].amount).toBe(10)
  })

  it('keeps the legacy trusted XP writer in sync without overwriting journal history', async () => {
    const { data, error } = await service.rpc('update_user_xp', {
      p_user_id: member.id,
      p_amount: 100,
      p_source: 'achievement',
      p_description: 'Trusted XP projection regression proof',
    })
    expect(error).toBeNull()
    expect(data?.amount).toBe(100)

    const [profile, progression] = await Promise.all([
      service.from('profiles').select('xp,rank').eq('id', member.id).single(),
      service.from('member_progression')
        .select('total_xp,current_rank,level').eq('user_id', member.id).single(),
    ])
    expect(profile.error).toBeNull()
    expect(progression.error).toBeNull()
    expect(profile.data).toMatchObject({ xp: 110, rank: 2 })
    expect(progression.data).toMatchObject({ total_xp: 110, current_rank: 2, level: 2 })

    const rewrite = await service
      .from('xp_transactions')
      .update({ amount: 1000 })
      .eq('id', data!.id)
    expect(rewrite.error).toBeTruthy()
  })

  it('blocks authenticated XP minting and progression manipulation', async () => {
    const forgedAward = await memberClient.rpc('update_user_xp', {
      p_user_id: partner.id,
      p_amount: 900,
      p_source: 'achievement',
      p_description: 'Forged user award',
    })
    expect(forgedAward.error).toBeTruthy()

    const forgedLedger = await memberClient.from('xp_transactions').insert({
      user_id: member.id,
      amount: 900,
      source: 'achievement',
      description: 'Forged ledger entry',
    })
    expect(forgedLedger.error).toBeTruthy()

    const forgedProgression = await memberClient
      .from('member_progression')
      .update({ total_xp: 99999, current_rank: 999 })
      .eq('user_id', member.id)
    expect(forgedProgression.error).toBeTruthy()

    const { data: profile } = await service
      .from('profiles').select('xp,rank').eq('id', member.id).single()
    expect(profile).toMatchObject({ xp: 110, rank: 2 })
  })
})
