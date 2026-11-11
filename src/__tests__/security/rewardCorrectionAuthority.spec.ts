import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from '@jest/globals'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Principal = {
  id: string
  email: string
  password: string
  client: SupabaseClient
}

describe('SN-ENG-02B2B2 feedback-linked XP corrections and achievement appeals', () => {
  let service: SupabaseClient
  let contributor: Principal
  let counterpart: Principal
  let outsider: Principal
  let adminOne: Principal
  let adminTwo: Principal
  let feedbackId: string
  let reportId: string
  let appealId: string

  const createPrincipal = async (name: string): Promise<Principal> => {
    const token = randomUUID()
    const email = name + '-' + token + '@test.local'
    const password = 'RewardCorrection-' + token + '-Aa1!'
    const { data, error } = await service.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (error || !data.user) throw error ?? new Error('Principal creation failed')
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const signIn = await client.auth.signInWithPassword({ email, password })
    if (signIn.error) throw signIn.error
    return { id: data.user.id, email, password, client }
  }

  beforeAll(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    if (!url || !key || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Local Supabase environment required for reward corrections')
    }
    service = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    contributor = await createPrincipal('correction-contributor')
    counterpart = await createPrincipal('correction-counterpart')
    outsider = await createPrincipal('correction-outsider')
    adminOne = await createPrincipal('correction-reviewer-first')
    adminTwo = await createPrincipal('correction-reviewer-second')

    for (const reviewer of [adminOne, adminTwo]) {
      const { error } = await service.from('profiles')
        .update({ is_admin: true, is_suspended: false })
        .eq('id', reviewer.id)
      if (error) throw error
    }

    const [need, offer] = await Promise.all([
      service.from('needs').insert({
        title: 'Reward review evidence Need',
        description: 'A legitimate jointly confirmed participation record for appeal testing.',
        category: 'personal', user_id: contributor.id, user_name: 'Contributor',
        boundaries: ['platonic'], location_mode: 'remote', status: 'active',
      }).select('id').single(),
      service.from('offers').insert({
        title: 'Reward review evidence Offer',
        description: 'The other participating member of a verified Exchange.',
        category: 'personal', user_id: counterpart.id, user_name: 'Counterpart',
        boundaries: ['platonic'], location_mode: 'remote', status: 'active',
        capacity: 2, current_capacity: 0,
      }).select('id').single(),
    ])
    if (need.error || !need.data || offer.error || !offer.data) {
      throw need.error ?? offer.error ?? new Error('Need/Offer setup failed')
    }
    const { data: connection, error: connectionError } = await service.from('surrogacies').insert({
      need_id: need.data.id,
      offer_id: offer.data.id,
      partner_ids: [contributor.id, counterpart.id],
      status: 'active',
    }).select('id').single()
    if (connectionError || !connection) throw connectionError ?? new Error('Connection setup failed')

    const { data: moment, error: momentError } = await service.from('moments').insert({
      surrogacy_id: connection.id,
      scheduled_time: new Date(Date.now() - 120000).toISOString(),
      duration: 30,
      status: 'scheduled',
    }).select('id').single()
    if (momentError || !moment) throw momentError ?? new Error('Moment setup failed')

    const { data: exchangeId, error: exchangeError } = await contributor.client.rpc(
      'complete_moment_for_trial',
      { p_moment_id: moment.id, p_exchange_status: 'completed' },
    )
    if (exchangeError || !exchangeId) throw exchangeError ?? new Error('Outcome reporting failed')

    const { data: state, error: confirmError } = await counterpart.client.rpc(
      'confirm_exchange_for_trial',
      { p_exchange_id: exchangeId, p_decision: 'confirm' },
    )
    if (confirmError || state !== 'confirmed') throw confirmError ?? new Error('Joint confirmation failed')

    const { data: recordedId, error: feedbackError } = await contributor.client.rpc(
      'submit_feedback_for_trial',
      {
        p_exchange_id: exchangeId,
        p_to_user_id: counterpart.id,
        p_rating: 2,
        p_breakdown: {},
        p_comments: 'Real Feedback submitted on a jointly confirmed Exchange.',
        p_skill_endorsements: [],
      },
    )
    if (feedbackError || !recordedId) throw feedbackError ?? new Error('Feedback failed')
    feedbackId = recordedId
  }, 90000)

  it('starts with exactly one real credited Feedback and evidence-linked badge', async () => {
    const [xp, badge, summary] = await Promise.all([
      service.from('xp_transactions')
        .select('id,amount,source').eq('user_id', contributor.id),
      contributor.client.from('member_achievements')
        .select('status,achievement_code').eq('user_id', contributor.id),
      contributor.client.rpc('get_my_reward_credit_summary'),
    ])
    expect(xp.error).toBeNull()
    expect(xp.data).toHaveLength(1)
    expect(xp.data?.[0].amount).toBe(10)
    expect(badge.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ achievement_code: 'first_reflection', status: 'earned' }),
    ]))
    expect(summary.data?.[0].credited_count).toBe(1)
  })

  it('rejects forged case origin, unsupported Feedback, outsiders and service-role requests', async () => {
    const forged = await counterpart.client.from('reports').insert({
      reporter_user_id: counterpart.id,
      reported_user_id: contributor.id,
      type: 'other', severity: 'medium',
      description: 'Try forging a privileged reward-review case.',
      case_origin: 'reward_review', reward_feedback_id: feedbackId,
    })
    expect(forged.error).toBeTruthy()

    const outsiderReview = await outsider.client.rpc('open_reward_feedback_review', {
      p_feedback_id: feedbackId,
      p_reason: 'This unrelated party is not a participant in the Feedback.',
    })
    expect(outsiderReview.error).toBeTruthy()

    const selfReview = await contributor.client.rpc('open_reward_feedback_review', {
      p_feedback_id: feedbackId,
      p_reason: 'A Feedback contributor cannot invent their own counterparty claim.',
    })
    expect(selfReview.error).toBeTruthy()

    const serviceReview = await service.rpc('open_reward_feedback_review', {
      p_feedback_id: feedbackId,
      p_reason: 'The service role may not impersonate a reporting member.',
    })
    expect(serviceReview.error).toBeTruthy()

    const trusted = await service.rpc('adjudicate_reward_review_trusted', {
      p_report_id: randomUUID(), p_admin_id: adminOne.id, p_decision: 'invalidate',
      p_reason: 'The trusted correction core is not callable by the service role.',
    })
    expect(trusted.error).toBeTruthy()
  })

  it('opens one counterparty-owned review without exposing it to outsiders', async () => {
    const { data, error } = await counterpart.client.rpc('open_reward_feedback_review', {
      p_feedback_id: feedbackId,
      p_reason: 'Please review the documented session participation and whether this XP credit is justified.',
    })
    expect(error).toBeNull()
    expect(data).toEqual(expect.any(String))
    reportId = data!

    const retry = await counterpart.client.rpc('open_reward_feedback_review', {
      p_feedback_id: feedbackId,
      p_reason: 'A repeat must not open another review or consume a new journal entry.',
    })
    expect(retry.error).toBeTruthy()

    const [subject, reporter, other, cases] = await Promise.all([
      contributor.client.from('reports').select('id,status,reward_feedback_id').eq('id', reportId),
      counterpart.client.from('reports').select('id,status').eq('id', reportId),
      outsider.client.from('reports').select('id').eq('id', reportId),
      service.from('reports').select('id').eq('reward_feedback_id', feedbackId),
    ])
    expect(subject.data).toHaveLength(1)
    expect(subject.data?.[0].reward_feedback_id).toBe(feedbackId)
    expect(reporter.data).toHaveLength(1)
    expect(other.data).toHaveLength(0)
    expect(cases.data).toHaveLength(1)
  })

  it('blocks the generic report moderator and all untrusted mutation methods', async () => {
    const generic = await adminOne.client.rpc('moderate_report_for_trial', {
      p_report_id: reportId,
      p_status: 'resolved',
      p_action_taken: 'The generic report workflow must not create XP correction authority.',
      p_suspend_reported_user: false,
    })
    expect(generic.error).toBeTruthy()

    const unauthenticated = await outsider.client.rpc('adjudicate_reward_review', {
      p_report_id: reportId, p_decision: 'invalidate',
      p_reason: 'Outsiders cannot change another member reward.',
    })
    expect(unauthenticated.error).toBeTruthy()

    const forgedAdmin = await counterpart.client.rpc('adjudicate_reward_review', {
      p_report_id: reportId, p_admin_id: adminOne.id, p_decision: 'invalidate',
      p_reason: 'Caller-supplied administrative identity is never a permission source.',
    })
    expect(forgedAdmin.error).toBeTruthy()

    const directCorrection = await contributor.client.from('reward_corrections').insert({
      report_id: reportId, feedback_id: feedbackId, member_id: contributor.id,
      action: 'reversed', xp_transaction_id: randomUUID(),
      reason: 'Forged compensation row should be denied before any XP impact.',
    })
    expect(directCorrection.error).toBeTruthy()
  })

  it('atomically reverses exactly 10 XP, revokes unsupported badge and preserves original evidence', async () => {
    const { data: outcome, error } = await adminOne.client.rpc('adjudicate_reward_review', {
      p_report_id: reportId,
      p_decision: 'invalidate',
      p_reason: 'Independent review of the recorded participant statements found the Feedback credit unsupported.',
    })
    expect(error).toBeNull()
    expect(outcome).toBe('reversed')

    const retry = await adminOne.client.rpc('adjudicate_reward_review', {
      p_report_id: reportId,
      p_decision: 'invalidate',
      p_reason: 'Repeated adjudication must not double-reverse the same original credit.',
    })
    expect(retry.error).toBeTruthy()

    const [xp, profile, progression, badges, feedback, corrections, summary, cases, audit] = await Promise.all([
      service.from('xp_transactions')
        .select('id,amount').eq('user_id', contributor.id).order('created_at'),
      service.from('profiles').select('xp,rank').eq('id', contributor.id).single(),
      service.from('member_progression')
        .select('total_xp,current_rank').eq('user_id', contributor.id).single(),
      contributor.client.from('member_achievements')
        .select('achievement_code,status,revocation_reason,revoked_by'),
      service.from('feedback').select('id').eq('id', feedbackId),
      contributor.client.from('reward_corrections')
        .select('action,member_id,report_id,reason'),
      contributor.client.rpc('get_my_reward_credit_summary'),
      service.from('reports').select('status,adjudication').eq('id', reportId).single(),
      service.from('audit_events').select('id')
        .eq('target_id', reportId).eq('action', 'reward_review_adjudicated'),
    ])
    expect(xp.error).toBeNull()
    expect(xp.data?.map((row) => row.amount).sort((a, b) => a - b)).toEqual([-10, 10])
    expect(profile.data).toMatchObject({ xp: 0, rank: 1 })
    expect(progression.data).toMatchObject({ total_xp: 0, current_rank: 1 })
    expect(badges.data?.find((row) => row.achievement_code === 'first_reflection'))
      .toMatchObject({ status: 'revoked', revoked_by: adminOne.id })
    expect(feedback.data).toHaveLength(1)
    expect(corrections.data).toHaveLength(1)
    expect(corrections.data?.[0].action).toBe('reversed')
    expect(summary.data?.[0].credited_count).toBe(0)
    expect(cases.data).toMatchObject({ status: 'resolved', adjudication: 'upheld' })
    expect(audit.data).toHaveLength(1)

    const immutable = await service.from('xp_transactions')
      .update({ amount: 90 }).eq('id', xp.data![0].id)
    expect(immutable.error).toBeTruthy()
  })

  it('limits appeals to the affected participant and requires a different administrator', async () => {
    const outsiderAppeal = await outsider.client.rpc('submit_reward_review_appeal', {
      p_report_id: reportId,
      p_reason: 'An unrelated member cannot appeal someone else review decision.',
    })
    expect(outsiderAppeal.error).toBeTruthy()

    const { data, error } = await contributor.client.rpc('submit_reward_review_appeal', {
      p_report_id: reportId,
      p_reason: 'I am requesting an independent second review of the documented Exchange participation evidence.',
    })
    expect(error).toBeNull()
    appealId = data!

    const duplicate = await contributor.client.rpc('submit_reward_review_appeal', {
      p_report_id: reportId,
      p_reason: 'Multiple appeals cannot silently reopen the same case.',
    })
    expect(duplicate.error).toBeTruthy()

    const firstAdminAppeal = await adminOne.client.rpc('review_reward_review_appeal', {
      p_appeal_id: appealId, p_decision: 'accept',
      p_reason: 'The original reviewer cannot approve their own work.',
    })
    expect(firstAdminAppeal.error).toBeTruthy()

    const outsiderDecision = await outsider.client.rpc('review_reward_review_appeal', {
      p_appeal_id: appealId, p_decision: 'accept',
      p_reason: 'An ordinary member cannot approve an appeal.',
    })
    expect(outsiderDecision.error).toBeTruthy()

    const accepted = await adminTwo.client.rpc('review_reward_review_appeal', {
      p_appeal_id: appealId,
      p_decision: 'accept',
      p_reason: 'The independent appeal contains documented evidence warranting reconsideration.',
    })
    expect(accepted.error).toBeNull()
    expect(accepted.data).toBe('accepted')

    const oldReviewer = await adminOne.client.rpc('adjudicate_reward_review', {
      p_report_id: reportId, p_decision: 'dismiss',
      p_reason: 'The original reviewer must not decide the reopened case.',
    })
    expect(oldReviewer.error).toBeTruthy()

    const [caseResult, appeal, audit] = await Promise.all([
      service.from('reports')
        .select('status,adjudication,adjudicated_by,resolved_at').eq('id', reportId).single(),
      contributor.client.from('report_appeals')
        .select('status,reviewer_id').eq('id', appealId).single(),
      service.from('audit_events')
        .select('id').eq('action', 'reward_review_appeal_reviewed').eq('target_id', appealId),
    ])
    expect(caseResult.data).toMatchObject({
      status: 'investigating', adjudication: 'upheld', adjudicated_by: adminOne.id,
    })
    expect(caseResult.data?.resolved_at).toBeNull()
    expect(appeal.data).toMatchObject({ status: 'accepted', reviewer_id: adminTwo.id })
    expect(audit.data).toHaveLength(1)
  })

  it('restores exactly 10 XP and the original badge without deleting the reversal', async () => {
    const { data, error } = await adminTwo.client.rpc('adjudicate_reward_review', {
      p_report_id: reportId,
      p_decision: 'dismiss',
      p_reason: 'Independent examination of the original session evidence supports reinstating the credited Feedback.',
    })
    expect(error).toBeNull()
    expect(data).toBe('restored')

    const [xp, profile, progression, badges, corrections, summary, audit] = await Promise.all([
      service.from('xp_transactions').select('id,amount')
        .eq('user_id', contributor.id),
      service.from('profiles').select('xp,rank').eq('id', contributor.id).single(),
      service.from('member_progression').select('total_xp').eq('user_id', contributor.id).single(),
      contributor.client.from('member_achievements')
        .select('status,revocation_reason,revoked_at').eq('achievement_code', 'first_reflection').single(),
      contributor.client.from('reward_corrections')
        .select('action,reason,report_id').eq('member_id', contributor.id),
      contributor.client.rpc('get_my_reward_credit_summary'),
      service.from('audit_events').select('id')
        .eq('target_id', reportId).eq('action', 'reward_review_adjudicated'),
    ])
    expect(xp.data?.map((row) => row.amount).sort((a, b) => a - b)).toEqual([-10, 10, 10])
    expect(profile.data).toMatchObject({ xp: 10, rank: 1 })
    expect(progression.data?.total_xp).toBe(10)
    expect(badges.data).toMatchObject({
      status: 'earned', revocation_reason: null, revoked_at: null,
    })
    expect(corrections.data).toHaveLength(2)
    expect(corrections.data?.map((row) => row.action).sort()).toEqual(['restored', 'reversed'])
    expect(summary.data?.[0].credited_count).toBe(1)
    expect(audit.data).toHaveLength(2)
  })
})
