import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from '@jest/globals'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Principal = { id: string; email: string; password: string }

describe('SN-ENG-02B bilateral Exchange evidence and reward safety', () => {
  let service: SupabaseClient
  let reporter: SupabaseClient
  let peer: SupabaseClient
  let stranger: SupabaseClient
  let first: Principal
  let second: Principal
  let connectionId: string
  let initialExchangeId: string
  let initialMomentId: string

  const createMember = async (label: string): Promise<Principal> => {
    const suffix = randomUUID()
    const email = label + '-' + suffix + '@test.local'
    const password = 'Exchange-' + suffix + '-Aa1!'
    const { data, error } = await service.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (error || !data.user) throw error ?? new Error('Member creation failed')
    return { id: data.user.id, email, password }
  }

  const signIn = async (person: Principal): Promise<SupabaseClient> => {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { error } = await client.auth.signInWithPassword({
      email: person.email,
      password: person.password,
    })
    if (error) throw error
    return client
  }

  const createScheduledMoment = async (): Promise<string> => {
    const { data, error } = await service.from('moments').insert({
      surrogacy_id: connectionId,
      scheduled_time: new Date(Date.now() - 120000).toISOString(),
      duration: 30,
      status: 'scheduled',
    }).select('id').single()
    if (error || !data) throw error ?? new Error('Moment setup failed')
    return data.id
  }

  const submitFeedback = (exchangeId: string) => reporter.rpc('submit_feedback_for_trial', {
    p_exchange_id: exchangeId,
    p_to_user_id: second.id,
    p_rating: 3,
    p_breakdown: {},
    p_comments: 'A review attached to the actual Exchange.',
    p_skill_endorsements: [],
  })

  beforeAll(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    if (!url || !serviceRoleKey || !key) {
      throw new Error('Local Supabase credentials are required for bilateral proof')
    }
    service = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    first = await createMember('exchange-reporter')
    second = await createMember('exchange-peer')
    const other = await createMember('exchange-outsider')
    reporter = await signIn(first)
    peer = await signIn(second)
    stranger = await signIn(other)

    const [need, offer] = await Promise.all([
      service.from('needs').insert({
        title: 'Bilateral outcome proof Need',
        description: 'Verification of real member confirmation before rewards.',
        category: 'personal',
        user_id: first.id,
        user_name: 'First Reporter',
        boundaries: ['platonic'],
        location_mode: 'remote',
        status: 'active',
      }).select('id').single(),
      service.from('offers').insert({
        title: 'Bilateral outcome proof Offer',
        description: 'Authorized second member verifying the Exchange outcome.',
        category: 'personal',
        user_id: second.id,
        user_name: 'Second Participant',
        boundaries: ['platonic'],
        location_mode: 'remote',
        status: 'active',
        capacity: 2,
        current_capacity: 0,
      }).select('id').single(),
    ])
    if (need.error || !need.data || offer.error || !offer.data) {
      throw need.error ?? offer.error ?? new Error('Need and Offer unavailable')
    }

    const { data: connection, error: connectionError } = await service
      .from('surrogacies').insert({
        need_id: need.data.id,
        offer_id: offer.data.id,
        partner_ids: [first.id, second.id],
        status: 'active',
      }).select('id').single()
    if (connectionError || !connection) {
      throw connectionError ?? new Error('Connection unavailable')
    }
    connectionId = connection.id
    initialMomentId = await createScheduledMoment()
  })

  it('records one reported outcome but not joint proof or immediate rewards', async () => {
    const { data: exchangeId, error } = await reporter.rpc('complete_moment_for_trial', {
      p_moment_id: initialMomentId,
      p_exchange_status: 'completed',
    })
    expect(error).toBeNull()
    expect(exchangeId).toEqual(expect.any(String))
    initialExchangeId = exchangeId as string

    const { data: exchange, error: exchangeReadError } = await reporter
      .from('exchanges')
      .select('confirmation_state,recorded_by,confirmed_by,status')
      .eq('id', initialExchangeId).single()
    expect(exchangeReadError).toBeNull()
    expect(exchange).toMatchObject({
      confirmation_state: 'pending',
      recorded_by: first.id,
      confirmed_by: null,
      status: 'completed',
    })

    const premature = await submitFeedback(initialExchangeId)
    expect(premature.error).toBeTruthy()

    const [xp, achievements] = await Promise.all([
      reporter.from('xp_transactions').select('id').eq('user_id', first.id),
      reporter.from('member_achievements').select('id').eq('user_id', first.id),
    ])
    expect(xp.error).toBeNull()
    expect(achievements.error).toBeNull()
    expect(xp.data).toHaveLength(0)
    expect(achievements.data).toHaveLength(0)
  })

  it('rejects self-confirmation, outsiders, and direct privileged mutations', async () => {
    const self = await reporter.rpc('confirm_exchange_for_trial', {
      p_exchange_id: initialExchangeId, p_decision: 'confirm',
    })
    expect(self.error).toBeTruthy()

    const unauthorized = await stranger.rpc('confirm_exchange_for_trial', {
      p_exchange_id: initialExchangeId, p_decision: 'confirm',
    })
    expect(unauthorized.error).toBeTruthy()

    const trusted = await service.rpc('confirm_exchange_for_trial_trusted', {
      p_exchange_id: initialExchangeId,
      p_actor_id: second.id,
      p_decision: 'confirm',
    })
    expect(trusted.error).toBeTruthy()

    const forgedActor = await reporter.rpc('confirm_exchange_for_trial', {
      p_exchange_id: initialExchangeId,
      p_actor_id: second.id,
      p_decision: 'confirm',
    })
    expect(forgedActor.error).toBeTruthy()

    const direct = await reporter.from('exchanges')
      .update({ confirmation_state: 'confirmed', confirmed_by: first.id })
      .eq('id', initialExchangeId)
    expect(direct.error).toBeTruthy()

    const { data: stillPending } = await service.from('exchanges')
      .select('confirmation_state').eq('id', initialExchangeId).single()
    expect(stillPending?.confirmation_state).toBe('pending')
  })

  it('accepts only the peer statement and makes verified Feedback reward-eligible', async () => {
    const { data: state, error } = await peer.rpc('confirm_exchange_for_trial', {
      p_exchange_id: initialExchangeId,
      p_decision: 'confirm',
    })
    expect(error).toBeNull()
    expect(state).toBe('confirmed')

    const retry = await peer.rpc('confirm_exchange_for_trial', {
      p_exchange_id: initialExchangeId,
      p_decision: 'confirm',
    })
    expect(retry.error).toBeNull()
    expect(retry.data).toBe('confirmed')

    const postConfirmationDispute = await peer.rpc('confirm_exchange_for_trial', {
      p_exchange_id: initialExchangeId,
      p_decision: 'dispute',
    })
    expect(postConfirmationDispute.error).toBeTruthy()

    const { data: exchange } = await service.from('exchanges')
      .select('confirmation_state,confirmed_at,recorded_by,confirmed_by')
      .eq('id', initialExchangeId).single()
    expect(exchange?.confirmation_state).toBe('confirmed')
    expect(exchange?.recorded_by).toBe(first.id)
    expect(exchange?.confirmed_by).toBe(second.id)
    expect(exchange?.confirmed_at).toEqual(expect.any(String))

    const feedback = await submitFeedback(initialExchangeId)
    expect(feedback.error).toBeNull()
    expect(feedback.data).toEqual(expect.any(String))
    const duplicate = await submitFeedback(initialExchangeId)
    expect(duplicate.error).toBeNull()
    expect(duplicate.data).toBe(feedback.data)

    const [xp, earned, audit] = await Promise.all([
      reporter.from('xp_transactions').select('amount,source').eq('user_id', first.id),
      reporter.from('member_achievements')
        .select('achievement_code').eq('user_id', first.id),
      service.from('audit_events').select('action')
        .eq('target_id', initialExchangeId).eq('action', 'exchange_confirmed'),
    ])
    expect(xp.error).toBeNull()
    expect(earned.error).toBeNull()
    expect(audit.error).toBeNull()
    expect(xp.data).toHaveLength(1)
    expect(xp.data?.[0]).toMatchObject({ amount: 10, source: 'feedback' })
    expect(earned.data?.map(item => item.achievement_code)).toContain('first_reflection')
    expect(audit.data).toHaveLength(1)
  })

  it('locks disputed outcome records and prevents new Feedback rewards', async () => {
    const momentId = await createScheduledMoment()
    const { data: exchangeId, error } = await reporter.rpc('complete_moment_for_trial', {
      p_moment_id: momentId, p_exchange_status: 'partial',
    })
    expect(error).toBeNull()
    expect(exchangeId).toEqual(expect.any(String))

    const { data: state, error: disputeError } = await peer.rpc('confirm_exchange_for_trial', {
      p_exchange_id: exchangeId!,
      p_decision: 'dispute',
    })
    expect(disputeError).toBeNull()
    expect(state).toBe('disputed')
    const retry = await peer.rpc('confirm_exchange_for_trial', {
      p_exchange_id: exchangeId!,
      p_decision: 'dispute',
    })
    expect(retry.error).toBeNull()
    expect(retry.data).toBe('disputed')

    const afterDispute = await peer.rpc('confirm_exchange_for_trial', {
      p_exchange_id: exchangeId!,
      p_decision: 'confirm',
    })
    expect(afterDispute.error).toBeTruthy()
    const feedback = await submitFeedback(exchangeId!)
    expect(feedback.error).toBeTruthy()

    const { data: exchange } = await service.from('exchanges')
      .select('status,confirmation_state,disputed_by')
      .eq('id', exchangeId!).single()
    expect(exchange).toMatchObject({
      status: 'disputed',
      confirmation_state: 'disputed',
      disputed_by: second.id,
    })
    const { data: xp } = await reporter.from('xp_transactions')
      .select('id').eq('user_id', first.id)
    expect(xp).toHaveLength(1)
  })

  it('keeps historic single-party Exchange records explicitly unverified', async () => {
    const momentId = await createScheduledMoment()
    const { data: historic, error } = await service.from('exchanges').insert({
      moment_id: momentId,
      surrogacy_id: connectionId,
      status: 'completed',
    }).select('id,confirmation_state').single()
    expect(error).toBeNull()
    expect(historic?.confirmation_state).toBe('legacy_unverified')
    const unverifiedFeedback = await submitFeedback(historic!.id)
    expect(unverifiedFeedback.error).toBeTruthy()
    const forgedConfirm = await peer.rpc('confirm_exchange_for_trial', {
      p_exchange_id: historic!.id,
      p_decision: 'confirm',
    })
    expect(forgedConfirm.error).toBeTruthy()
  })
})
