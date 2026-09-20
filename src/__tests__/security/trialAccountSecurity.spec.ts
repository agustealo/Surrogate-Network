import { beforeAll, describe, expect, it } from '@jest/globals'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

const POLICY_VERSION = '2026-09-20'

describe('Trial consent and account lifecycle security', () => {
  let url: string
  let anonKey: string
  let serviceRoleKey: string
  let service: SupabaseClient
  let member: User

  beforeAll(async () => {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    if (!url || !anonKey || !serviceRoleKey) throw new Error('Local Supabase credentials are required')

    service = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await service.auth.admin.createUser({
      email: 'trial-account-security@test.local',
      password: 'Trial-Account-Security-123!',
      email_confirm: true,
      user_metadata: {
        name: 'Trial Account Security',
        trial_terms_version: POLICY_VERSION,
        trial_privacy_version: POLICY_VERSION,
        trial_age_confirmed: true,
      },
    })
    if (error || !data.user) throw error ?? new Error('Failed to create lifecycle principal')
    member = data.user
  })

  async function memberClient(): Promise<SupabaseClient> {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error } = await client.auth.signInWithPassword({
      email: 'trial-account-security@test.local',
      password: 'Trial-Account-Security-123!',
    })
    if (error) throw error
    return client
  }

  it('persists current trial consent from signup metadata', async () => {
    const { data, error } = await service
      .from('profiles')
      .select('trial_terms_version,trial_terms_accepted_at,trial_privacy_version,trial_privacy_accepted_at,trial_age_confirmed_at')
      .eq('id', member.id)
      .single()

    expect(error).toBeNull()
    expect(data?.trial_terms_version).toBe(POLICY_VERSION)
    expect(data?.trial_privacy_version).toBe(POLICY_VERSION)
    expect(data?.trial_terms_accepted_at).toBeTruthy()
    expect(data?.trial_privacy_accepted_at).toBeTruthy()
    expect(data?.trial_age_confirmed_at).toBeTruthy()
  })

  it('does not let an authenticated client forge consent fields', async () => {
    const client = await memberClient()
    const { error } = await client
      .from('profiles')
      .update({ trial_terms_version: 'forged', trial_age_confirmed_at: new Date().toISOString() })
      .eq('id', member.id)

    expect(error).toBeTruthy()
  })

  it('does not let an authenticated client invoke the consent authority RPC', async () => {
    const client = await memberClient()
    const { error } = await client.rpc('accept_current_trial_policy', {
      p_user_id: member.id,
      p_terms_version: POLICY_VERSION,
      p_privacy_version: POLICY_VERSION,
      p_age_confirmed: true,
    })

    expect(error).toBeTruthy()
  })

  it('does not let an authenticated client forge deactivation state', async () => {
    const client = await memberClient()
    const { error } = await client
      .from('profiles')
      .update({ trial_deactivated_at: new Date().toISOString() })
      .eq('id', member.id)

    expect(error).toBeTruthy()
  })

  it('allows trusted deactivation and then blocks marketplace writes through RLS', async () => {
    const { error: deactivateError } = await service.rpc('set_trial_account_participation', {
      p_user_id: member.id,
      p_active: false,
    })
    expect(deactivateError).toBeNull()

    const client = await memberClient()
    const { error: writeError } = await client.from('needs').insert({
      title: 'Inactive account write',
      description: 'This operation must be rejected while trial participation is deactivated.',
      category: 'personal',
      user_id: member.id,
      user_name: 'Trial Account Security',
      boundaries: ['platonic'],
      location_mode: 'remote',
    })
    expect(writeError).toBeTruthy()
  })

  it('allows trusted reactivation when the account is not suspended', async () => {
    const { error } = await service.rpc('set_trial_account_participation', {
      p_user_id: member.id,
      p_active: true,
    })
    expect(error).toBeNull()

    const { data: profile } = await service
      .from('profiles')
      .select('trial_deactivated_at')
      .eq('id', member.id)
      .single()
    expect(profile?.trial_deactivated_at).toBeNull()
  })

  it('prevents trusted self-reactivation while moderation suspension is active', async () => {
    await service.from('profiles').update({ is_suspended: true }).eq('id', member.id)
    await service.rpc('set_trial_account_participation', { p_user_id: member.id, p_active: false })

    const { error } = await service.rpc('set_trial_account_participation', {
      p_user_id: member.id,
      p_active: true,
    })
    expect(error).toBeTruthy()

    await service.from('profiles').update({ is_suspended: false, trial_deactivated_at: null }).eq('id', member.id)
  })
})
