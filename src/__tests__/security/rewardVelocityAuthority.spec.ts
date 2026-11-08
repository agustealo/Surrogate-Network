import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from '@jest/globals'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Principal = {
  id: string
  email: string
  password: string
  client: SupabaseClient
}

describe('SN-ENG-02B2A reward-credit velocity and historical integrity', () => {
  let service: SupabaseClient
  let reviewer: Principal
  let secondReviewer: Principal
  let peers: Principal[]

  const createPrincipal = async (name: string): Promise<Principal> => {
    const suffix = randomUUID()
    const email = name + '-' + suffix + '@test.local'
    const password = 'RewardVelocity-' + suffix + '-Aa1!'
    const { data, error } = await service.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (error || !data.user) throw error ?? new Error('Could not create member')

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { error: loginError } = await client.auth.signInWithPassword({
      email, password,
    })
    if (loginError) throw loginError
    return { id: data.user.id, email, password, client }
  }

  const createConnection = async (
    reporter: Principal,
    counterpart: Principal,
  ): Promise<string> => {
    const suffix = randomUUID()
    const [need, offer] = await Promise.all([
      service.from('needs').insert({
        title: 'Reward velocity Need ' + suffix.slice(0, 8),
        description: 'An actual Need for authoritative reward-velocity security verification.',
        category: 'personal',
        user_id: reporter.id,
        user_name: 'Reward Reviewer',
        boundaries: ['platonic'],
        location_mode: 'remote',
        status: 'active',
      }).select('id').single(),
      service.from('offers').insert({
        title: 'Reward velocity Offer ' + suffix.slice(0, 8),
        description: 'A real member counterpart in a completed and confirmed Exchange.',
        category: 'personal',
        user_id: counterpart.id,
        user_name: 'Reward Counterpart',
        boundaries: ['platonic'],
        location_mode: 'remote',
        status: 'active',
        capacity: 2,
        current_capacity: 0,
      }).select('id').single(),
    ])
    if (need.error || !need.data || offer.error || !offer.data) {
      throw need.error ?? offer.error ?? new Error('Need and Offer setup failed')
    }

    const { data, error } = await service.from('surrogacies').insert({
      need_id: need.data.id,
      offer_id: offer.data.id,
      partner_ids: [reporter.id, counterpart.id],
      status: 'active',
    }).select('id').single()
    if (error || !data) throw error ?? new Error('Connection setup failed')
    return data.id
  }

  const createConfirmedExchange = async (
    reporter: Principal,
    counterpart: Principal,
    surrogacyId: string,
  ): Promise<string> => {
    const { data: moment, error: momentError } = await service.from('moments').insert({
      surrogacy_id: surrogacyId,
      scheduled_time: new Date(Date.now() - 120000).toISOString(),
      duration: 30,
      status: 'scheduled',
    }).select('id').single()
    if (momentError || !moment) throw momentError ?? new Error('Moment setup failed')

    const { data: exchangeId, error: reportError } = await reporter.client.rpc(
      'complete_moment_for_trial',
      { p_moment_id: moment.id, p_exchange_status: 'completed' },
    )
    if (reportError || !exchangeId) {
      throw reportError ?? new Error('Exchange outcome reporting failed')
    }

    const { data: state, error: confirmError } = await counterpart.client.rpc(
      'confirm_exchange_for_trial',
      { p_exchange_id: exchangeId, p_decision: 'confirm' },
    )
    if (confirmError || state !== 'confirmed') {
      throw confirmError ?? new Error('Independent confirmation failed')
    }
    return exchangeId
  }

  const submitReview = (
    from: Principal,
    to: Principal,
    exchangeId: string,
  ) => from.client.rpc('submit_feedback_for_trial', {
    p_exchange_id: exchangeId,
    p_to_user_id: to.id,
    p_rating: 2,
    p_breakdown: {},
    p_comments: 'Submitted after two-party confirmed participation.',
    p_skill_endorsements: [],
  })

  const runEligibleReview = async (
    from: Principal,
    to: Principal,
    connectionId: string,
  ): Promise<{ id: string; exchangeId: string }> => {
    const exchangeId = await createConfirmedExchange(from, to, connectionId)
    const { data, error } = await submitReview(from, to, exchangeId)
    if (error || !data) throw error ?? new Error('Legitimate Feedback was rejected')
    return { id: data, exchangeId }
  }

  const summaryFor = async (person: Principal) => {
    const { data, error } = await person.client.rpc('get_my_reward_credit_summary')
    if (error || !data?.length) {
      throw error ?? new Error('Reward credit summary was not available')
    }
    return data[0]
  }

  beforeAll(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    if (!url || !key || !anon) {
      throw new Error('Local Supabase credentials required for reward-velocity tests')
    }
    service = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    reviewer = await createPrincipal('reward-velocity-reviewer')
    secondReviewer = await createPrincipal('reward-velocity-concurrent-reviewer')
    peers = []
    for (let index = 0; index < 4; index += 1) {
      peers.push(await createPrincipal('reward-velocity-peer-' + index))
    }
  }, 60000)

  it('never exposes private exclusions or other members credit counts', async () => {
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { error: anonError } = await anon.rpc('get_my_reward_credit_summary')
    expect(anonError).toBeTruthy()

    const impersonation = await reviewer.client.rpc('get_my_reward_credit_summary', {
      p_member_id: peers[0].id,
    })
    expect(impersonation.error).toBeTruthy()

    const privateTable = await reviewer.client
      .schema('private').from('reward_credit_exclusions').select('*')
    expect(privateTable.error).toBeTruthy()

    expect(await summaryFor(reviewer)).toMatchObject({
      credited_count: 0,
      excluded_count: 0,
      member_seven_day_limit: 10,
      pair_seven_day_limit: 4,
    })
  }, 20000)

  it('caps both directions of a member pair across separate Connections but saves Feedback', async () => {
    const connection = await createConnection(reviewer, peers[0])
    for (let i = 0; i < 4; i += 1) {
      const credited = await runEligibleReview(reviewer, peers[0], connection)
      expect(credited.id).toEqual(expect.any(String))
    }

    const anotherConnection = await createConnection(reviewer, peers[0])
    const excluded = await runEligibleReview(reviewer, peers[0], anotherConnection)
    const repeat = await submitReview(reviewer, peers[0], excluded.exchangeId)
    expect(repeat.error).toBeNull()
    expect(repeat.data).toBe(excluded.id)

    const reverse = await submitReview(peers[0], reviewer, excluded.exchangeId)
    expect(reverse.error).toBeNull()
    expect(reverse.data).toEqual(expect.any(String))

    const [mine, theirs, audit, creditedXp, achievements] = await Promise.all([
      summaryFor(reviewer),
      summaryFor(peers[0]),
      service.from('audit_events')
        .select('target_id,reason')
        .eq('action', 'reward_credit_excluded')
        .in('target_id', [excluded.id, reverse.data!]),
      service.from('xp_transactions').select('id')
        .eq('user_id', reviewer.id).eq('source', 'feedback'),
      reviewer.client.from('member_achievements')
        .select('achievement_code').eq('user_id', reviewer.id),
    ])
    expect(audit.error).toBeNull()
    expect(creditedXp.error).toBeNull()
    expect(achievements.error).toBeNull()
    expect(mine).toMatchObject({ credited_count: 4, excluded_count: 1 })
    expect(theirs).toMatchObject({ credited_count: 0, excluded_count: 1 })
    expect(audit.data).toHaveLength(2)
    expect(audit.data?.every((event) => event.reason === 'pair_weekly_limit')).toBe(true)
    expect(creditedXp.data).toHaveLength(4)
    expect(achievements.data?.map((row) => row.achievement_code))
      .toEqual(expect.arrayContaining(['first_reflection', 'thoughtful_participant']))
  }, 90000)

  it('enforces member-wide weekly limits across distinct counterparts without rejecting Feedback', async () => {
    for (const index of [1, 2]) {
      const connectionId = await createConnection(reviewer, peers[index])
      for (let i = 0; i < 3; i += 1) {
        await runEligibleReview(reviewer, peers[index], connectionId)
      }
    }

    const newPair = await createConnection(reviewer, peers[3])
    const withheld = await runEligibleReview(reviewer, peers[3], newPair)

    const [summary, feedback, xp, achievements, audit] = await Promise.all([
      summaryFor(reviewer),
      service.from('feedback').select('id').eq('from_user_id', reviewer.id),
      service.from('xp_transactions').select('id').eq('user_id', reviewer.id)
        .eq('source', 'feedback'),
      reviewer.client.from('member_achievements')
        .select('achievement_code').eq('user_id', reviewer.id),
      service.from('audit_events')
        .select('target_id,reason')
        .eq('action', 'reward_credit_excluded')
        .eq('target_id', withheld.id),
    ])
    expect(feedback.error).toBeNull()
    expect(xp.error).toBeNull()
    expect(achievements.error).toBeNull()
    expect(audit.error).toBeNull()
    expect(summary).toMatchObject({ credited_count: 10, excluded_count: 2 })
    expect(feedback.data).toHaveLength(12)
    expect(xp.data).toHaveLength(10)
    expect(achievements.data?.map((row) => row.achievement_code))
      .toContain('consistent_reflector')
    expect(audit.data).toHaveLength(1)
    expect(audit.data?.[0].reason).toBe('member_weekly_limit')
  }, 120000)

  it('serializes simultaneous two-direction Feedback at the last pair-credit slot', async () => {
    const peer = peers[3]
    const connectionId = await createConnection(secondReviewer, peer)
    for (let i = 0; i < 3; i += 1) {
      await runEligibleReview(secondReviewer, peer, connectionId)
    }

    const exchangeId = await createConfirmedExchange(secondReviewer, peer, connectionId)
    const [fromReviewer, fromPeer] = await Promise.all([
      submitReview(secondReviewer, peer, exchangeId),
      submitReview(peer, secondReviewer, exchangeId),
    ])
    expect(fromReviewer.error).toBeNull()
    expect(fromPeer.error).toBeNull()

    const [reviewerSummary, peerSummary, audit] = await Promise.all([
      summaryFor(secondReviewer),
      summaryFor(peer),
      service.from('audit_events').select('target_id,reason')
        .eq('action', 'reward_credit_excluded')
        .in('target_id', [fromReviewer.data!, fromPeer.data!]),
    ])
    expect(audit.error).toBeNull()
    expect(reviewerSummary.credited_count + peerSummary.credited_count).toBe(4)
    expect(reviewerSummary.excluded_count + peerSummary.excluded_count).toBe(1)
    expect(audit.data).toHaveLength(1)
    expect(audit.data?.[0].reason).toBe('pair_weekly_limit')
  }, 90000)
})
