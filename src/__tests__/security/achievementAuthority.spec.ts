import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from '@jest/globals'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Principal = {
  id: string
  email: string
  password: string
}

describe('SN-ENG-02 evidence-linked achievements and governance', () => {
  let service: SupabaseClient
  let member: SupabaseClient
  let partnerClient: SupabaseClient
  let outsider: SupabaseClient
  let adminClient: SupabaseClient
  let contributor: Principal
  let partner: Principal
  let administrator: Principal

  const createPrincipal = async (label: string): Promise<Principal> => {
    const token = randomUUID()
    const email = label + '-' + token + '@test.local'
    const password = 'Achievement-' + token + '-Aa1!'
    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error || !data.user) throw error ?? new Error('Unable to provision achievement test user')
    return { id: data.user.id, email, password }
  }

  const clientFor = async (principal: Principal): Promise<SupabaseClient> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error } = await client.auth.signInWithPassword({
      email: principal.email,
      password: principal.password,
    })
    if (error) throw error
    return client
  }

  const submitEligibleFeedback = async (): Promise<string> => {
    const token = randomUUID()
    const [needResult, offerResult] = await Promise.all([
      service.from('needs').insert({
        title: 'Recognition Need ' + token.slice(0, 8),
        description: 'Real authoritative lifecycle evidence for a recognition test.',
        category: 'personal',
        user_id: contributor.id,
        user_name: 'Recognition Contributor',
        boundaries: ['platonic'],
        location_mode: 'remote',
        status: 'active',
      }).select('id').single(),
      service.from('offers').insert({
        title: 'Recognition Offer ' + token.slice(0, 8),
        description: 'An eligible conversation supporting the member feedback journey.',
        category: 'personal',
        user_id: partner.id,
        user_name: 'Recognition Partner',
        boundaries: ['platonic'],
        location_mode: 'remote',
        status: 'active',
        capacity: 2,
        current_capacity: 0,
      }).select('id').single(),
    ])
    if (needResult.error || !needResult.data) throw needResult.error ?? new Error('Need creation failed')
    if (offerResult.error || !offerResult.data) throw offerResult.error ?? new Error('Offer creation failed')

    const { data: connection, error: connectionError } = await service
      .from('surrogacies')
      .insert({
        need_id: needResult.data.id,
        offer_id: offerResult.data.id,
        partner_ids: [contributor.id, partner.id],
        status: 'active',
      })
      .select('id')
      .single()
    if (connectionError || !connection) throw connectionError ?? new Error('Connection creation failed')

    const { data: moment, error: momentError } = await service
      .from('moments')
      .insert({
        surrogacy_id: connection.id,
        scheduled_time: new Date(Date.now() - 120000).toISOString(),
        duration: 30,
        status: 'scheduled',
      })
      .select('id')
      .single()
    if (momentError || !moment) throw momentError ?? new Error('Moment creation failed')

    const { data: exchangeId, error: exchangeError } = await member.rpc(
      'complete_moment_for_trial', {
        p_moment_id: moment.id,
        p_exchange_status: 'completed',
      },
    )
    if (exchangeError || !exchangeId) {
      throw exchangeError ?? new Error('Unable to report Exchange')
    }
    const { data: state, error: confirmError } = await partnerClient.rpc(
      'confirm_exchange_for_trial', {
        p_exchange_id: exchangeId,
        p_decision: 'confirm',
      },
    )
    if (confirmError || state !== 'confirmed') {
      throw confirmError ?? new Error('Exchange was not jointly confirmed')
    }

    const { data, error } = await member.rpc('submit_feedback_for_trial', {
      p_exchange_id: exchangeId,
      p_to_user_id: partner.id,
      p_rating: 2,
      p_breakdown: {},
      p_comments: 'The Exchange completed and I am sharing feedback.',
      p_skill_endorsements: [],
    })
    if (error || !data) throw error ?? new Error('Feedback submission failed')
    return data as string
  }

  beforeAll(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    if (!url || !key || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Local Supabase credentials required for achievement authority test')
    }

    service = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    contributor = await createPrincipal('achievement-contributor')
    partner = await createPrincipal('achievement-partner')
    administrator = await createPrincipal('achievement-admin')
    const another = await createPrincipal('achievement-other')

    const { error: promotionError } = await service.from('profiles')
      .update({ is_admin: true })
      .eq('id', administrator.id)
    if (promotionError) throw promotionError

    member = await clientFor(contributor)
    partnerClient = await clientFor(partner)
    outsider = await clientFor(another)
    adminClient = await clientFor(administrator)
  })

  it('exposes only read-only catalog and owned award records to signed-in members', async () => {
    const { data: definitions, error: readError } = await member.from('achievement_definitions')
      .select('code,title,target,enabled')
    expect(readError).toBeNull()
    expect(definitions?.map((definition) => definition.code).sort()).toEqual([
      'consistent_reflector',
      'first_reflection',
      'thoughtful_participant',
    ])

    const { data: otherAwards, error: otherReadError } = await outsider
      .from('member_achievements').select('id').eq('user_id', contributor.id)
    expect(otherReadError).toBeNull()
    expect(otherAwards).toHaveLength(0)

    const forgedRule = await member.from('achievement_definitions')
      .update({ enabled: false }).eq('code', 'first_reflection')
    expect(forgedRule.error).toBeTruthy()

    const forgedAward = await member.from('member_achievements').insert({
      user_id: contributor.id,
      achievement_code: 'first_reflection',
      rule_version: 1,
      evidence_event_type: 'feedback',
      evidence_event_id: randomUUID(),
    })
    expect(forgedAward.error).toBeTruthy()

    const spoofedAdmin = await member.rpc('set_achievement_rule_enabled', {
      p_code: 'first_reflection',
      p_enabled: false,
      p_reason: 'Attempt to impersonate the system administrator',
    })
    expect(spoofedAdmin.error).toBeTruthy()

    const forgedIdentity = await member.rpc('set_achievement_rule_enabled', {
      p_admin_id: administrator.id,
      p_code: 'first_reflection',
      p_enabled: false,
      p_reason: 'Forge administrator identity with an injected parameter',
    })
    expect(forgedIdentity.error).toBeTruthy()

    const trustedCoreFromService = await service.rpc('set_achievement_rule_enabled_trusted', {
      p_admin_id: administrator.id,
      p_code: 'first_reflection',
      p_enabled: false,
      p_reason: 'Attempt to reach a postgres-only privileged core',
    })
    expect(trustedCoreFromService.error).toBeTruthy()
  })

  it('awards First Reflection once against persisted eligible Feedback evidence', async () => {
    const feedbackId = await submitEligibleFeedback()

    const { data: awards, error } = await member.from('member_achievements')
      .select('achievement_code,rule_version,evidence_event_id,evidence_feedback_id,status')
      .eq('user_id', contributor.id)
    expect(error).toBeNull()
    expect(awards).toHaveLength(1)
    expect(awards?.[0]).toMatchObject({
      achievement_code: 'first_reflection',
      rule_version: 1,
      status: 'earned',
      evidence_event_id: feedbackId,
      evidence_feedback_id: feedbackId,
    })

    const { data: existingFeedback, error: readError } = await service
      .from('feedback').select('exchange_id,to_user_id').eq('id', feedbackId).single()
    expect(readError).toBeNull()
    expect(existingFeedback?.to_user_id).toBe(partner.id)

    const replay = await member.rpc('submit_feedback_for_trial', {
      p_exchange_id: existingFeedback!.exchange_id,
      p_to_user_id: partner.id,
      p_rating: 2,
      p_breakdown: {},
      p_comments: 'Retry must not issue duplicate recognition.',
      p_skill_endorsements: [],
    })
    expect(replay.error).toBeNull()
    expect(replay.data).toBe(feedbackId)

    const { count, error: countError } = await member.from('member_achievements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', contributor.id)
    expect(countError).toBeNull()
    expect(count).toBe(1)
  })

  it('pauses new awards without deleting earned achievements, and resumes at a new rule version', async () => {
    const denyBadReason = await adminClient.rpc('set_achievement_rule_enabled', {
      p_code: 'thoughtful_participant',
      p_enabled: false,
      p_reason: 'short',
    })
    expect(denyBadReason.error).toBeTruthy()

    const pause = await adminClient.rpc('set_achievement_rule_enabled', {
      p_code: 'thoughtful_participant',
      p_enabled: false,
      p_reason: 'Temporarily suspend milestone issuance for governance review',
    })
    expect(pause.error).toBeNull()

    await submitEligibleFeedback()
    await submitEligibleFeedback()

    const duringPause = await member.from('member_achievements')
      .select('achievement_code')
      .eq('achievement_code', 'thoughtful_participant')
    expect(duringPause.error).toBeNull()
    expect(duringPause.data).toHaveLength(0)

    const { data: firstReflection } = await member.from('member_achievements')
      .select('status')
      .eq('achievement_code', 'first_reflection')
      .single()
    expect(firstReflection?.status).toBe('earned')

    const resume = await adminClient.rpc('set_achievement_rule_enabled', {
      p_code: 'thoughtful_participant',
      p_enabled: true,
      p_reason: 'Validation complete and future milestone issuance approved',
    })
    expect(resume.error).toBeNull()

    const fourthFeedbackId = await submitEligibleFeedback()
    const afterResume = await member.from('member_achievements')
      .select('achievement_code,rule_version,evidence_event_id,status')
      .eq('achievement_code', 'thoughtful_participant')
      .single()
    expect(afterResume.error).toBeNull()
    expect(afterResume.data).toMatchObject({
      achievement_code: 'thoughtful_participant',
      rule_version: 3,
      evidence_event_id: fourthFeedbackId,
      status: 'earned',
    })

    const { data: audit, error: auditError } = await service.from('audit_events')
      .select('id,reason,actor_id')
      .eq('action', 'achievement_rule_state_changed')
      .eq('target_id', 'thoughtful_participant')
    expect(auditError).toBeNull()
    expect(audit).toHaveLength(2)
    expect(audit?.every((event) => event.actor_id === administrator.id && !!event.reason)).toBe(true)
  })

  it('purges evidence-linked awards when the member account becomes a terminal tombstone', async () => {
    const { error } = await service.from('profiles')
      .update({ trial_deleted_at: new Date().toISOString() })
      .eq('id', contributor.id)
    expect(error).toBeNull()

    const { data: awards, error: readError } = await service.from('member_achievements')
      .select('id')
      .eq('user_id', contributor.id)
    expect(readError).toBeNull()
    expect(awards).toHaveLength(0)
  })
})
