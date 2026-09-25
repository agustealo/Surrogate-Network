import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from '@jest/globals'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

type Principal = {
  user: User
  email: string
  password: string
}

describe('Consumer-trial data boundaries', () => {
  let url: string
  let anonKey: string
  let serviceKey: string
  let service: SupabaseClient
  let memberA: Principal
  let memberB: Principal
  let memberC: Principal
  let admin: Principal

  const createPrincipal = async (label: string): Promise<Principal> => {
    const suffix = randomUUID()
    const email = `${label}-${suffix}@test.local`
    const password = `Test-${suffix}-Aa1!`
    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error || !data.user) throw error ?? new Error(`Unable to create ${label}`)
    return { user: data.user, email, password }
  }

  const clientFor = async (principal: Principal): Promise<SupabaseClient> => {
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

    memberA = await createPrincipal('boundary-a')
    memberB = await createPrincipal('boundary-b')
    memberC = await createPrincipal('boundary-c')
    admin = await createPrincipal('boundary-admin')

    const { error } = await service
      .from('profiles')
      .update({ is_admin: true, is_suspended: false, name: 'Boundary Admin' })
      .eq('id', admin.user.id)
    if (error) throw error
  })

  it('keeps token and XP mutation functions out of member and anonymous authority', async () => {
    const member = await clientFor(memberA)
    const anonymous = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const tokenAttempt = await member.rpc('update_token_balance', {
      p_user_id: memberA.user.id,
      p_amount: 500,
      p_reason: 'boundary regression',
      p_transaction_type: 'earned',
    })
    const xpAttempt = await member.rpc('update_user_xp', {
      p_user_id: memberA.user.id,
      p_amount: 500,
      p_source: 'login',
      p_description: 'boundary regression',
    })
    const anonymousAttempt = await anonymous.rpc('update_token_balance', {
      p_user_id: memberA.user.id,
      p_amount: 1,
      p_reason: 'anonymous boundary regression',
      p_transaction_type: 'earned',
    })

    expect(tokenAttempt.error).toBeTruthy()
    expect(xpAttempt.error).toBeTruthy()
    expect(anonymousAttempt.error).toBeTruthy()
  })

  it('keeps private profile rows self-only while exposing the safe projection', async () => {
    const clientA = await clientFor(memberA)

    const privateRead = await clientA
      .from('profiles')
      .select('id,email,name')
      .eq('id', memberB.user.id)
      .maybeSingle()
    expect(privateRead.error).toBeNull()
    expect(privateRead.data).toBeNull()

    const selfRead = await clientA
      .from('profiles')
      .select('id,email')
      .eq('id', memberA.user.id)
      .single()
    expect(selfRead.error).toBeNull()
    expect(selfRead.data?.email).toBe(memberA.email)

    const publicRead = await clientA
      .from('public_profiles')
      .select('*')
      .eq('id', memberB.user.id)
      .single()
    expect(publicRead.error).toBeNull()
    expect(publicRead.data?.id).toBe(memberB.user.id)
    expect(publicRead.data).not.toHaveProperty('email')
    expect(publicRead.data).not.toHaveProperty('token_balance')
    expect(publicRead.data).not.toHaveProperty('xp')
    expect(publicRead.data).not.toHaveProperty('is_admin')
    expect(publicRead.data).not.toHaveProperty('is_suspended')
  })

  it('blocks member writes to authoritative profile and offer counters', async () => {
    const clientA = await clientFor(memberA)

    for (const mutation of [
      { rank: 999 },
      { xp: 999999 },
      { token_balance: 999999 },
      { verification_status: 'fully_verified' },
      { is_suspended: false },
    ]) {
      const { error } = await clientA.from('profiles').update(mutation).eq('id', memberA.user.id)
      expect(error).toBeTruthy()
    }

    const { data: offer, error: seedError } = await service.from('offers').insert({
      title: 'Boundary Offer',
      description: 'Offer used to prove capacity and reputation ownership.',
      category: 'personal',
      user_id: memberA.user.id,
      user_name: 'Boundary A',
      boundaries: ['platonic'],
      location_mode: 'remote',
      status: 'active',
      capacity: 5,
      current_capacity: 0,
    }).select('id').single()
    if (seedError || !offer) throw seedError ?? new Error('Unable to seed offer')

    const counterAttempt = await clientA
      .from('offers')
      .update({ current_capacity: 4, rating: 5, review_count: 99 })
      .eq('id', offer.id)
    expect(counterAttempt.error).toBeTruthy()
  })

  it('keeps listing lifecycle state and relationship anchors non-destructive', async () => {
    const [{ data: need, error: needError }, { data: offer, error: offerError }] = await Promise.all([
      service.from('needs').insert({
        title: 'Lifecycle Need',
        description: 'Need used to prove lifecycle state is database authoritative.',
        category: 'personal',
        user_id: memberA.user.id,
        user_name: 'Boundary A',
        boundaries: ['platonic'],
        location_mode: 'remote',
        status: 'active',
      }).select('id').single(),
      service.from('offers').insert({
        title: 'Lifecycle Offer',
        description: 'Offer used to prove relationship anchors cannot be hard deleted.',
        category: 'personal',
        user_id: memberA.user.id,
        user_name: 'Boundary A',
        boundaries: ['platonic'],
        location_mode: 'remote',
        status: 'active',
        capacity: 2,
        current_capacity: 0,
      }).select('id').single(),
    ])
    if (needError || !need) throw needError ?? new Error('Unable to seed lifecycle need')
    if (offerError || !offer) throw offerError ?? new Error('Unable to seed lifecycle offer')

    const clientA = await clientFor(memberA)
    const forgeNeedStatus = await clientA.from('needs').update({ status: 'fulfilled' }).eq('id', need.id)
    const deleteNeed = await clientA.from('needs').delete().eq('id', need.id)
    const deleteOffer = await clientA.from('offers').delete().eq('id', offer.id)

    expect(forgeNeedStatus.error).toBeTruthy()
    expect(deleteNeed.error).toBeTruthy()
    expect(deleteOffer.error).toBeTruthy()

    const [needStillExists, offerStillExists] = await Promise.all([
      service.from('needs').select('id,status').eq('id', need.id).single(),
      service.from('offers').select('id,status').eq('id', offer.id).single(),
    ])
    expect(needStillExists.data?.status).toBe('active')
    expect(offerStillExists.data?.status).toBe('active')
  })

  it('denies direct proposal status mutation', async () => {
    const [{ data: need, error: needError }, { data: offer, error: offerError }] = await Promise.all([
      service.from('needs').insert({
        title: 'Boundary Need',
        description: 'Need used for direct proposal mutation regression.',
        category: 'personal',
        user_id: memberB.user.id,
        user_name: 'Boundary B',
        boundaries: ['platonic'],
        location_mode: 'remote',
        status: 'active',
      }).select('id').single(),
      service.from('offers').insert({
        title: 'Boundary Proposal Offer',
        description: 'Offer used for direct proposal mutation regression.',
        category: 'personal',
        user_id: memberA.user.id,
        user_name: 'Boundary A',
        boundaries: ['platonic'],
        location_mode: 'remote',
        status: 'active',
        capacity: 2,
        current_capacity: 0,
      }).select('id').single(),
    ])
    if (needError || !need) throw needError ?? new Error('Unable to seed need')
    if (offerError || !offer) throw offerError ?? new Error('Unable to seed offer')

    const clientA = await clientFor(memberA)
    const { data: proposal, error: createError } = await clientA.from('proposals').insert({
      need_id: need.id,
      offer_id: offer.id,
      proposing_user_id: memberA.user.id,
      receiving_user_id: memberB.user.id,
    }).select('id,status').single()
    if (createError || !proposal) throw createError ?? new Error('Unable to seed proposal')
    expect(proposal.status).toBe('pending')

    const clientB = await clientFor(memberB)
    const [proposerAttempt, recipientAttempt] = await Promise.all([
      clientA.from('proposals').update({ status: 'accepted' }).eq('id', proposal.id),
      clientB.from('proposals').update({ status: 'accepted' }).eq('id', proposal.id),
    ])
    expect(proposerAttempt.error).toBeTruthy()
    expect(recipientAttempt.error).toBeTruthy()
  })

  it('blocks suspended members from operational writes', async () => {
    const { error: suspendError } = await service
      .from('profiles')
      .update({ is_suspended: true })
      .eq('id', memberC.user.id)
    if (suspendError) throw suspendError

    const clientC = await clientFor(memberC)
    const attempt = await clientC.from('needs').insert({
      title: 'Suspended Need',
      description: 'This write must be denied by the active-member boundary.',
      category: 'personal',
      user_id: memberC.user.id,
      user_name: 'Boundary C',
      boundaries: ['platonic'],
      location_mode: 'remote',
    })
    expect(attempt.error).toBeTruthy()

    await service.from('profiles').update({ is_suspended: false }).eq('id', memberC.user.id)
  })

  it('keeps report resolution and notification content authoritative', async () => {
    const clientA = await clientFor(memberA)
    const { data: report, error: reportError } = await clientA.from('reports').insert({
      reporter_user_id: memberA.user.id,
      reported_user_id: memberC.user.id,
      type: 'other',
      severity: 'medium',
      description: 'Boundary report with sufficient detail for regression coverage.',
    }).select('id,status').single()
    if (reportError || !report) throw reportError ?? new Error('Unable to seed report')
    expect(report.status).toBe('pending')

    const reportMutation = await clientA
      .from('reports')
      .update({ status: 'dismissed', action_taken: 'forged result' })
      .eq('id', report.id)
    expect(reportMutation.error).toBeTruthy()

    const { data: notification, error: notificationError } = await service.from('notifications').insert({
      user_id: memberA.user.id,
      type: 'system',
      title: 'Original title',
      body: 'Original body',
      read: false,
    }).select('id').single()
    if (notificationError || !notification) throw notificationError ?? new Error('Unable to seed notification')

    const markRead = await clientA.from('notifications').update({ read: true }).eq('id', notification.id)
    const rewrite = await clientA.from('notifications').update({ title: 'Forged title' }).eq('id', notification.id)
    expect(markRead.error).toBeNull()
    expect(rewrite.error).toBeTruthy()
  })

  it('requires verified admin authority for authoritative profile changes', async () => {
    const clientA = await clientFor(memberA)
    const nonAdminAttempt = await clientA.rpc('admin_update_profile', {
      p_id: memberB.user.id,
      p_name: 'Unauthorized admin change',
    })
    expect(nonAdminAttempt.error).toBeTruthy()

    const adminClient = await clientFor(admin)
    const adminAttempt = await adminClient.rpc('admin_update_profile', {
      p_id: memberB.user.id,
      p_name: 'Boundary B',
      p_xp: 100,
    })
    expect(adminAttempt.error).toBeNull()
  })

  it('preserves audit evidence after the actor account is deleted', async () => {
    const disposable = await createPrincipal('boundary-audit')
    const { data: audit, error: auditError } = await service.from('audit_events').insert({
      actor_id: disposable.user.id,
      action: 'boundary_test_action',
      target_id: 'boundary-test-target',
      target_type: 'security-test',
    }).select('id').single()
    if (auditError || !audit) throw auditError ?? new Error('Unable to seed audit event')

    const { error: deleteError } = await service.auth.admin.deleteUser(disposable.user.id)
    if (deleteError) throw deleteError

    const { data: preserved, error: readError } = await service
      .from('audit_events')
      .select('actor_id,action')
      .eq('id', audit.id)
      .single()
    expect(readError).toBeNull()
    expect(preserved?.actor_id).toBeNull()
    expect(preserved?.action).toBe('boundary_test_action')
  })
})