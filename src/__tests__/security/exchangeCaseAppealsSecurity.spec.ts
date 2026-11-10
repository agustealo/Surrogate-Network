import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from '@jest/globals'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Principal = {
  id: string
  email: string
  password: string
  client: SupabaseClient
}

describe('SN-ENG-02B2B1 independently adjudicated Exchange cases and member appeals', () => {
  let service: SupabaseClient
  let reporter: Principal
  let peer: Principal
  let outsider: Principal
  let firstAdmin: Principal
  let secondAdmin: Principal
  let connectionId: string
  let exchangeId: string
  let reportId: string
  let appealId: string

  const createPrincipal = async (label: string): Promise<Principal> => {
    const token = randomUUID()
    const email = label + '-' + token + '@test.local'
    const password = 'Dispute-' + token + '-Aa1!'
    const { data, error } = await service.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (error || !data.user) throw error ?? new Error('Member provisioning failed')
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { error: signInError } = await client.auth.signInWithPassword({ email, password })
    if (signInError) throw signInError
    return { id: data.user.id, email, password, client }
  }

  const createMoment = async (): Promise<string> => {
    const { data, error } = await service.from('moments').insert({
      surrogacy_id: connectionId,
      scheduled_time: new Date(Date.now() - 120000).toISOString(),
      duration: 30,
      status: 'scheduled',
    }).select('id').single()
    if (error || !data) throw error ?? new Error('Moment creation failed')
    return data.id
  }

  beforeAll(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const role = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    if (!url || !role || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Local Supabase credentials required')
    }
    service = createClient(url, role, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    reporter = await createPrincipal('case-reporter')
    peer = await createPrincipal('case-peer')
    outsider = await createPrincipal('case-outsider')
    firstAdmin = await createPrincipal('case-admin-original')
    secondAdmin = await createPrincipal('case-admin-independent')

    for (const admin of [firstAdmin, secondAdmin]) {
      const { error } = await service.from('profiles')
        .update({ is_admin: true, is_suspended: false }).eq('id', admin.id)
      if (error) throw error
    }

    const [need, offer] = await Promise.all([
      service.from('needs').insert({
        title: 'Exchange dispute case Need',
        description: 'Independent review of a recorded two-member Exchange dispute.',
        category: 'personal', user_id: reporter.id, user_name: 'Reporter',
        boundaries: ['platonic'], location_mode: 'remote', status: 'active',
      }).select('id').single(),
      service.from('offers').insert({
        title: 'Exchange dispute case Offer',
        description: 'Second participant in the Exchange dispute review case.',
        category: 'personal', user_id: peer.id, user_name: 'Peer',
        boundaries: ['platonic'], location_mode: 'remote', status: 'active',
        capacity: 2, current_capacity: 0,
      }).select('id').single(),
    ])
    if (need.error || !need.data || offer.error || !offer.data) {
      throw need.error ?? offer.error ?? new Error('Need/Offer setup failed')
    }
    const { data: connection, error } = await service.from('surrogacies')
      .insert({
        need_id: need.data.id, offer_id: offer.data.id,
        partner_ids: [reporter.id, peer.id], status: 'active',
      }).select('id').single()
    if (error || !connection) throw error ?? new Error('Connection setup failed')
    connectionId = connection.id
  }, 60000)

  it('automatically opens one existing Reports case when a peer disputes an outcome', async () => {
    const momentId = await createMoment()
    const { data: id, error: reportError } = await reporter.client.rpc(
      'complete_moment_for_trial',
      { p_moment_id: momentId, p_exchange_status: 'partial' },
    )
    expect(reportError).toBeNull()
    exchangeId = id!

    const { data: state, error: disputeError } = await peer.client.rpc(
      'confirm_exchange_for_trial',
      { p_exchange_id: exchangeId, p_decision: 'dispute' },
    )
    expect(disputeError).toBeNull()
    expect(state).toBe('disputed')

    const retry = await peer.client.rpc('confirm_exchange_for_trial', {
      p_exchange_id: exchangeId, p_decision: 'dispute',
    })
    expect(retry.error).toBeNull()

    const { data: cases, error: caseError } = await service.from('reports')
      .select('id,case_origin,exchange_id,reporter_user_id,reported_user_id,status')
      .eq('exchange_id', exchangeId)
    expect(caseError).toBeNull()
    expect(cases).toHaveLength(1)
    expect(cases?.[0]).toMatchObject({
      case_origin: 'exchange_dispute',
      exchange_id: exchangeId,
      reporter_user_id: peer.id,
      reported_user_id: reporter.id,
      status: 'pending',
    })
    reportId = cases![0].id

    const { data: feedback } = await service.from('feedback')
      .select('id').eq('exchange_id', exchangeId)
    expect(feedback).toHaveLength(0)
  })

  it('allows initial disputed reports but prevents client forgery of moderation cases', async () => {
    const momentId = await createMoment()
    const original = await reporter.client.rpc('complete_moment_for_trial', {
      p_moment_id: momentId, p_exchange_status: 'disputed',
    })
    expect(original.error).toBeNull()

    const { data: autoCase, error: caseError } = await service.from('reports')
      .select('id,case_origin').eq('exchange_id', original.data!).single()
    expect(caseError).toBeNull()
    expect(autoCase?.case_origin).toBe('exchange_dispute')

    const forged = await peer.client.from('reports').insert({
      reporter_user_id: peer.id, reported_user_id: reporter.id,
      type: 'other', severity: 'medium',
      description: 'Attempt to create a forged Exchange dispute case',
      case_origin: 'exchange_dispute',
      exchange_id: exchangeId,
    })
    expect(forged.error).toBeTruthy()

    const forgedMemberReport = await peer.client.from('reports').insert({
      reporter_user_id: peer.id, reported_user_id: reporter.id,
      type: 'other', severity: 'medium',
      description: 'Attempt to set a privileged case link from a normal report',
      case_origin: 'member_report', exchange_id: exchangeId,
    })
    expect(forgedMemberReport.error).toBeTruthy()

    const genericAdmin = await firstAdmin.client.rpc('moderate_report_for_trial', {
      p_report_id: reportId, p_status: 'resolved',
      p_action_taken: 'Bypass bespoke Exchange dispute authorization.',
      p_suspend_reported_user: false,
    })
    expect(genericAdmin.error).toBeTruthy()
  })

  it('denies actor spoofing, outsider and service-role adjudication', async () => {
    const outsiderDecision = await outsider.client.rpc('adjudicate_exchange_dispute', {
      p_report_id: reportId, p_decision: 'uphold',
      p_reason: 'Unauthorized attempt to resolve the disputed Exchange.',
    })
    expect(outsiderDecision.error).toBeTruthy()
    const peerDecision = await peer.client.rpc('adjudicate_exchange_dispute', {
      p_report_id: reportId, p_decision: 'dismiss',
      p_reason: 'A participant cannot resolve their own Exchange case.',
    })
    expect(peerDecision.error).toBeTruthy()
    const serviceDecision = await service.rpc('adjudicate_exchange_dispute', {
      p_report_id: reportId, p_decision: 'uphold',
      p_reason: 'Service role cannot simulate an administrator identity.',
    })
    expect(serviceDecision.error).toBeTruthy()
    const forgedIdentity = await outsider.client.rpc('adjudicate_exchange_dispute', {
      p_report_id: reportId, p_admin_id: firstAdmin.id,
      p_decision: 'uphold', p_reason: 'Forged administrator identity in payload.',
    })
    expect(forgedIdentity.error).toBeTruthy()
    const trustedCore = await service.rpc('adjudicate_exchange_dispute_trusted', {
      p_report_id: reportId, p_admin_id: firstAdmin.id,
      p_decision: 'uphold', p_reason: 'Service role cannot call the trusted core.',
    })
    expect(trustedCore.error).toBeTruthy()
  })

  it('independently adjudicates once with a rationale, while keeping the Exchange disputed', async () => {
    const decision = await firstAdmin.client.rpc('adjudicate_exchange_dispute', {
      p_report_id: reportId, p_decision: 'uphold',
      p_reason: 'Both recorded participant statements require an unresolved disputed classification.',
    })
    expect(decision.error).toBeNull()
    expect(decision.data).toBe('uphold')
    const retry = await firstAdmin.client.rpc('adjudicate_exchange_dispute', {
      p_report_id: reportId, p_decision: 'uphold',
      p_reason: 'Replay should not replace the original audit record.',
    })
    expect(retry.error).toBeTruthy()

    const [caseResult, exchangeResult, audit, xp] = await Promise.all([
      service.from('reports')
        .select('status,adjudication,adjudicated_by,adjudicated_at,action_taken')
        .eq('id', reportId).single(),
      service.from('exchanges')
        .select('confirmation_state,status,confirmed_by').eq('id', exchangeId).single(),
      service.from('audit_events')
        .select('id,actor_id').eq('action', 'exchange_dispute_adjudicated')
        .eq('target_id', reportId),
      service.from('xp_transactions').select('id')
        .eq('user_id', peer.id),
    ])
    expect(caseResult.data).toMatchObject({
      status: 'resolved', adjudication: 'upheld', adjudicated_by: firstAdmin.id,
    })
    expect(caseResult.data?.adjudicated_at).toBeTruthy()
    expect(exchangeResult.data).toMatchObject({
      confirmation_state: 'disputed', status: 'disputed', confirmed_by: null,
    })
    expect(audit.data).toHaveLength(1)
    expect(xp.data).toHaveLength(0)
  })

  it('lets only an affected member submit one appeal within the case window', async () => {
    const forged = await outsider.client.rpc('submit_exchange_case_appeal', {
      p_report_id: reportId,
      p_reason: 'An unrelated account attempts to appeal an Exchange outcome.',
    })
    expect(forged.error).toBeTruthy()
    const { data: id, error } = await peer.client.rpc('submit_exchange_case_appeal', {
      p_report_id: reportId,
      p_reason: 'Please review the supporting conversation context and completion record.',
    })
    expect(error).toBeNull()
    appealId = id!
    const duplicate = await peer.client.rpc('submit_exchange_case_appeal', {
      p_report_id: reportId,
      p_reason: 'Duplicate appeal should not create another case record.',
    })
    expect(duplicate.error).toBeTruthy()

    const [mine, others, direct, serviceAppeal] = await Promise.all([
      peer.client.from('report_appeals').select('id,status,reason'),
      reporter.client.from('report_appeals').select('id,status,reason'),
      peer.client.from('report_appeals').insert({
        report_id: reportId, appellant_user_id: peer.id,
        reason: 'Forged direct appeal insertion attempt.',
      }),
      service.from('report_appeals').select('id').eq('report_id', reportId),
    ])
    expect(mine.error).toBeNull()
    expect(mine.data).toHaveLength(1)
    expect(others.error).toBeNull()
    expect(others.data).toHaveLength(0)
    expect(direct.error).toBeTruthy()
    expect(serviceAppeal.data).toHaveLength(1)
  })

  it('requires a second admin for appeal review and preserves the original reviewer history', async () => {
    const selfReview = await firstAdmin.client.rpc('review_exchange_case_appeal', {
      p_appeal_id: appealId, p_decision: 'accept',
      p_reason: 'The same administrator must not review their own case decision.',
    })
    expect(selfReview.error).toBeTruthy()
    const outsiderReview = await outsider.client.rpc('review_exchange_case_appeal', {
      p_appeal_id: appealId, p_decision: 'accept',
      p_reason: 'Non-admin appeal decisions are never authorized.',
    })
    expect(outsiderReview.error).toBeTruthy()

    const accepted = await secondAdmin.client.rpc('review_exchange_case_appeal', {
      p_appeal_id: appealId, p_decision: 'accept',
      p_reason: 'Additional record evidence warrants reopening for independent consideration.',
    })
    expect(accepted.error).toBeNull()
    expect(accepted.data).toBe('accepted')

    const oldReviewer = await firstAdmin.client.rpc('adjudicate_exchange_dispute', {
      p_report_id: reportId, p_decision: 'dismiss',
      p_reason: 'Original reviewer must not decide the reopened case.',
    })
    expect(oldReviewer.error).toBeTruthy()

    const [report, appeal, audit] = await Promise.all([
      service.from('reports')
        .select('status,adjudication,adjudicated_by,resolved_at')
        .eq('id', reportId).single(),
      service.from('report_appeals')
        .select('status,reviewer_id,decision_reason,reviewed_at')
        .eq('id', appealId).single(),
      service.from('audit_events').select('id')
        .eq('target_id', appealId).eq('action', 'exchange_case_appeal_reviewed'),
    ])
    expect(report.data).toMatchObject({
      status: 'investigating', adjudication: 'upheld', adjudicated_by: firstAdmin.id,
    })
    expect(report.data?.resolved_at).toBeNull()
    expect(appeal.data?.reviewer_id).toBe(secondAdmin.id)
    expect(appeal.data?.status).toBe('accepted')
    expect(audit.data).toHaveLength(1)

    const reconsider = await secondAdmin.client.rpc('adjudicate_exchange_dispute', {
      p_report_id: reportId, p_decision: 'dismiss',
      p_reason: 'Independent review found insufficient corroboration to uphold this case.',
    })
    expect(reconsider.error).toBeNull()

    const { data: after } = await service.from('reports')
      .select('status,adjudication,adjudicated_by').eq('id', reportId).single()
    expect(after).toMatchObject({
      status: 'dismissed', adjudication: 'dismissed', adjudicated_by: secondAdmin.id,
    })
    const { data: exchange } = await service.from('exchanges')
      .select('confirmation_state,confirmed_by').eq('id', exchangeId).single()
    expect(exchange?.confirmation_state).toBe('disputed')
    expect(exchange?.confirmed_by).toBeNull()
  })
})
