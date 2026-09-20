import { beforeAll, describe, expect, it } from '@jest/globals'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

type Principal = {
  user: User
  email: string
  password: string
}

describe('Authenticated actor ownership boundary', () => {
  let url: string
  let anonKey: string
  let serviceRoleKey: string
  let service: SupabaseClient
  let memberA: Principal
  let memberB: Principal
  let memberC: Principal
  let admin: Principal

  const createPrincipal = async (label: string): Promise<Principal> => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const email = `${label}-${suffix}@test.local`
    const password = `Trial-${label}-${suffix}-A9!`
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
    serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    if (!url || !anonKey || !serviceRoleKey) {
      throw new Error('Authority tests require local Supabase credentials')
    }

    service = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    memberA = await createPrincipal('authority-a')
    memberB = await createPrincipal('authority-b')
    memberC = await createPrincipal('authority-c')
    admin = await createPrincipal('authority-admin')

    const { error } = await service
      .from('profiles')
      .update({ is_admin: true, is_suspended: false, name: 'Authority Admin' })
      .eq('id', admin.user.id)
    if (error) throw error
  })

  it('records consent only for the authenticated member and exposes no user-id argument', async () => {
    const clientA = await clientFor(memberA)
    const accepted = await clientA.rpc('accept_current_trial_policy', {
      p_terms_version: '2026-09-20',
      p_privacy_version: '2026-09-20',
      p_age_confirmed: true,
    })
    expect(accepted.error).toBeNull()

    const spoofAttempt = await clientA.rpc('accept_current_trial_policy', {
      p_user_id: memberB.user.id,
      p_terms_version: '2026-09-20',
      p_privacy_version: '2026-09-20',
      p_age_confirmed: true,
    })
    expect(spoofAttempt.error).toBeTruthy()

    const { data: profiles, error } = await service
      .from('profiles')
      .select('id,trial_terms_version,trial_age_confirmed_at')
      .in('id', [memberA.user.id, memberB.user.id])
    expect(error).toBeNull()

    const profileA = profiles?.find((profile) => profile.id === memberA.user.id)
    const profileB = profiles?.find((profile) => profile.id === memberB.user.id)
    expect(profileA?.trial_terms_version).toBe('2026-09-20')
    expect(profileA?.trial_age_confirmed_at).toBeTruthy()
    expect(profileB?.trial_terms_version).toBeNull()
  })

  it('binds trial deactivation and reactivation to the authenticated account', async () => {
    const clientA = await clientFor(memberA)

    const deactivate = await clientA.rpc('set_trial_account_participation', { p_active: false })
    expect(deactivate.error).toBeNull()

    const { data: afterDeactivate } = await service
      .from('profiles')
      .select('trial_deactivated_at')
      .eq('id', memberA.user.id)
      .single()
    expect(afterDeactivate?.trial_deactivated_at).toBeTruthy()

    const spoofAttempt = await clientA.rpc('set_trial_account_participation', {
      p_user_id: memberB.user.id,
      p_active: false,
    })
    expect(spoofAttempt.error).toBeTruthy()

    const reactivate = await clientA.rpc('set_trial_account_participation', { p_active: true })
    expect(reactivate.error).toBeNull()

    const { data: afterReactivate } = await service
      .from('profiles')
      .select('trial_deactivated_at')
      .eq('id', memberA.user.id)
      .single()
    expect(afterReactivate?.trial_deactivated_at).toBeNull()
  })

  it('accepts a proposal as the signed-in recipient without any actor parameter', async () => {
    const [{ data: need, error: needError }, { data: offer, error: offerError }] = await Promise.all([
      service.from('needs').insert({
        title: 'Authority Need',
        description: 'Need used to prove authenticated actor proposal ownership.',
        category: 'personal',
        user_id: memberB.user.id,
        user_name: 'Authority B',
        boundaries: ['platonic'],
        location_mode: 'remote',
        status: 'active',
      }).select('id').single(),
      service.from('offers').insert({
        title: 'Authority Offer',
        description: 'Offer used to prove authenticated actor proposal ownership.',
        category: 'personal',
        user_id: memberA.user.id,
        user_name: 'Authority A',
        boundaries: ['platonic'],
        location_mode: 'remote',
        status: 'active',
        capacity: 2,
        current_capacity: 0,
      }).select('id').single(),
    ])
    if (needError || !need) throw needError ?? new Error('Unable to seed Need')
    if (offerError || !offer) throw offerError ?? new Error('Unable to seed Offer')

    const clientA = await clientFor(memberA)
    const { data: proposal, error: proposalError } = await clientA.from('proposals').insert({
      need_id: need.id,
      offer_id: offer.id,
      proposing_user_id: memberA.user.id,
      receiving_user_id: memberB.user.id,
      status: 'pending',
    }).select('id').single()
    if (proposalError || !proposal) throw proposalError ?? new Error('Unable to seed proposal')

    const proposerAttempt = await clientA.rpc('accept_proposal_for_trial', {
      p_proposal_id: proposal.id,
    })
    expect(proposerAttempt.error).toBeTruthy()

    const clientB = await clientFor(memberB)
    const accepted = await clientB.rpc('accept_proposal_for_trial', {
      p_proposal_id: proposal.id,
    })
    expect(accepted.error).toBeNull()
    expect(accepted.data).toEqual(expect.any(String))
  })

  it('does not expose trusted actor-parameter cores to authenticated or service-role callers', async () => {
    const clientA = await clientFor(memberA)
    const memberAttempt = await clientA.rpc('set_trial_account_participation_trusted', {
      p_user_id: memberB.user.id,
      p_active: false,
    })
    const serviceAttempt = await service.rpc('set_trial_account_participation_trusted', {
      p_user_id: memberB.user.id,
      p_active: false,
    })

    expect(memberAttempt.error).toBeTruthy()
    expect(serviceAttempt.error).toBeTruthy()
  })

  it('derives moderation identity from the authenticated administrator session', async () => {
    const clientA = await clientFor(memberA)
    const { data: report, error: reportError } = await clientA.from('reports').insert({
      reporter_user_id: memberA.user.id,
      reported_user_id: memberC.user.id,
      type: 'other',
      severity: 'medium',
      description: 'Authority-boundary moderation report with enough detail.',
      status: 'pending',
    }).select('id').single()
    if (reportError || !report) throw reportError ?? new Error('Unable to seed report')

    const nonAdminAttempt = await clientA.rpc('moderate_report_for_trial', {
      p_report_id: report.id,
      p_status: 'investigating',
      p_action_taken: null,
      p_suspend_reported_user: false,
    })
    expect(nonAdminAttempt.error).toBeTruthy()

    const adminClient = await clientFor(admin)
    const adminAttempt = await adminClient.rpc('moderate_report_for_trial', {
      p_report_id: report.id,
      p_status: 'investigating',
      p_action_taken: null,
      p_suspend_reported_user: false,
    })
    expect(adminAttempt.error).toBeNull()

    const spoofAttempt = await clientA.rpc('moderate_report_for_trial', {
      p_report_id: report.id,
      p_admin_id: admin.user.id,
      p_status: 'resolved',
      p_action_taken: 'forged admin identity',
      p_suspend_reported_user: false,
    })
    expect(spoofAttempt.error).toBeTruthy()
  })
})
