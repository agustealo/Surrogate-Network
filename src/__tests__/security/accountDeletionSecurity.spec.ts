import { beforeAll, describe, expect, it } from '@jest/globals'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

const POLICY_VERSION = '2026-09-20'

describe('Terminal account deletion authority', () => {
  let url = ''
  let anonKey = ''
  let serviceRoleKey = ''
  let service: SupabaseClient
  let member: User
  let memberEmail = ''
  let memberCredential = ''

  beforeAll(async () => {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    if (!url || !anonKey || !serviceRoleKey) throw new Error('Local Supabase credentials are required')

    service = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    memberEmail = `account-delete-${suffix}@test.local`
    memberCredential = `Account-Delete-${suffix}-A9!`
    const { data, error } = await service.auth.admin.createUser({
      email: memberEmail,
      password: memberCredential,
      email_confirm: true,
      user_metadata: {
        name: 'Deletion Security Member',
        trial_terms_version: POLICY_VERSION,
        trial_privacy_version: POLICY_VERSION,
        trial_age_confirmed: true,
      },
    })
    if (error || !data.user) throw error ?? new Error('Failed to create deletion principal')
    member = data.user
  })

  async function memberClient(): Promise<SupabaseClient> {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error } = await client.auth.signInWithPassword({
      email: memberEmail,
      password: memberCredential,
    })
    if (error) throw error
    return client
  }

  it('rejects direct client writes to terminal deletion state', async () => {
    const client = await memberClient()
    const { error } = await client
      .from('profiles')
      .update({ trial_deleted_at: new Date().toISOString() })
      .eq('id', member.id)
    expect(error).toBeTruthy()
  })

  it('requires an authenticated member for deletion preparation', async () => {
    const anonymous = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error } = await anonymous.rpc('prepare_trial_account_deletion')
    expect(error).toBeTruthy()
  })

  it('redacts the member while preserving stable marketplace history and blocking stale-session resurrection', async () => {
    const client = await memberClient()
    const [{ data: need, error: needError }, { data: offer, error: offerError }] = await Promise.all([
      client.from('needs').insert({
        title: 'Personally identifying need title',
        description: 'Private deletion test description',
        category: 'personal',
        user_id: member.id,
        user_name: 'Deletion Security Member',
        boundaries: ['platonic'],
        location_mode: 'remote',
        tags: ['private-tag'],
      }).select('id').single(),
      client.from('offers').insert({
        title: 'Personally identifying offer title',
        description: 'Private deletion test offer description',
        category: 'personal',
        user_id: member.id,
        user_name: 'Deletion Security Member',
        boundaries: ['platonic'],
        location_mode: 'remote',
      }).select('id').single(),
    ])
    if (needError || !need) throw needError ?? new Error('Unable to create deletion Need')
    if (offerError || !offer) throw offerError ?? new Error('Unable to create deletion Offer')

    const prepared = await client.rpc('prepare_trial_account_deletion')
    expect(prepared.error).toBeNull()

    const { data: profile, error: profileError } = await service
      .from('profiles')
      .select('name,email,bio,trial_deactivated_at,trial_deleted_at,is_admin,xp')
      .eq('id', member.id)
      .single()
    expect(profileError).toBeNull()
    expect(profile).toMatchObject({
      name: 'Deleted member',
      bio: '',
      is_admin: false,
      xp: 0,
    })
    expect(profile?.email).toMatch(/^deleted\+[a-f0-9]+@deleted\.invalid$/)
    expect(profile?.trial_deactivated_at).toBeTruthy()
    expect(profile?.trial_deleted_at).toBeTruthy()

    const { data: active } = await service.rpc('is_active_member', { p_user_id: member.id })
    expect(active).toBe(false)

    const { data: publicProfile, error: publicError } = await service
      .from('public_profiles')
      .select('id')
      .eq('id', member.id)
      .maybeSingle()
    expect(publicError).toBeNull()
    expect(publicProfile).toBeNull()

    const [{ data: redactedNeed }, { data: redactedOffer }] = await Promise.all([
      service.from('needs').select('id,title,description,user_name,status').eq('id', need.id).single(),
      service.from('offers').select('id,title,description,user_name,status').eq('id', offer.id).single(),
    ])
    expect(redactedNeed).toMatchObject({ title: 'Deleted member need', description: '', user_name: 'Deleted member', status: 'paused' })
    expect(redactedOffer).toMatchObject({ title: 'Deleted member offer', description: '', user_name: 'Deleted member', status: 'paused' })

    // PostgREST may report an RLS-filtered UPDATE as a successful request that
    // affects zero rows. Prove the security invariant from returned rows and
    // authoritative persisted state instead of relying on transport semantics.
    const rewriteProfile = await client
      .from('profiles')
      .update({ bio: 'stale session rewrite' })
      .eq('id', member.id)
      .select('id,bio')
    expect(rewriteProfile.error).toBeNull()
    expect(rewriteProfile.data ?? []).toHaveLength(0)

    const { data: tombstoneAfterRewrite, error: tombstoneReadError } = await service
      .from('profiles')
      .select('bio,name,trial_deleted_at')
      .eq('id', member.id)
      .single()
    expect(tombstoneReadError).toBeNull()
    expect(tombstoneAfterRewrite?.bio).toBe('')
    expect(tombstoneAfterRewrite?.name).toBe('Deleted member')
    expect(tombstoneAfterRewrite?.trial_deleted_at).toBeTruthy()

    const recreateNeed = await client.from('needs').insert({
      title: 'Stale session attempt',
      description: 'Must be rejected after deletion preparation.',
      category: 'personal',
      user_id: member.id,
      user_name: 'Deleted member',
      boundaries: ['platonic'],
      location_mode: 'remote',
    })
    expect(recreateNeed.error).toBeTruthy()
    const reactivate = await client.rpc('set_trial_account_participation', { p_active: true })
    expect(reactivate.error).toBeTruthy()

    const { data: job, error: jobError } = await service
      .from('account_deletion_jobs')
      .select('prepared_at,auth_deleted_at,attempt_count,last_error')
      .eq('user_id', member.id)
      .single()
    expect(jobError).toBeNull()
    expect(job?.prepared_at).toBeTruthy()
    expect(job?.auth_deleted_at).toBeNull()
    expect(job?.attempt_count).toBe(0)
    expect(job?.last_error).toBeNull()
  })

  it('records Auth cleanup while preserving the redacted relational tombstone', async () => {
    const { error: deleteError } = await service.auth.admin.deleteUser(member.id)
    expect(deleteError).toBeNull()

    const recorded = await service.rpc('record_trial_auth_deletion_attempt', {
      p_user_id: member.id,
      p_auth_deleted: true,
      p_error: null,
    })
    expect(recorded.error).toBeNull()

    const [{ data: profile, error: profileError }, { data: job, error: jobError }] = await Promise.all([
      service.from('profiles').select('id,trial_deleted_at').eq('id', member.id).single(),
      service.from('account_deletion_jobs').select('auth_deleted_at,attempt_count,last_error').eq('user_id', member.id).single(),
    ])
    expect(profileError).toBeNull()
    expect(profile?.id).toBe(member.id)
    expect(profile?.trial_deleted_at).toBeTruthy()
    expect(jobError).toBeNull()
    expect(job?.auth_deleted_at).toBeTruthy()
    expect(job?.attempt_count).toBe(1)
    expect(job?.last_error).toBeNull()
  })
})
