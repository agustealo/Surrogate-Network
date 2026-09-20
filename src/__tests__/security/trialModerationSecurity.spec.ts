import { beforeAll, describe, expect, it } from '@jest/globals'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

describe('Trial moderation security', () => {
  let url: string
  let anonKey: string
  let serviceRoleKey: string
  let service: SupabaseClient
  let reporter: User
  let reported: User
  let admin: User
  let nonAdmin: User
  let reportId: string

  beforeAll(async () => {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    if (!url || !anonKey || !serviceRoleKey) throw new Error('Local Supabase credentials are required')

    service = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const createPrincipal = async (email: string): Promise<User> => {
      const { data, error } = await service.auth.admin.createUser({
        email,
        password: 'Moderation-Security-123!',
        email_confirm: true,
      })
      if (error || !data.user) throw error ?? new Error(`Failed to create ${email}`)
      return data.user
    }

    reporter = await createPrincipal('moderation-reporter@test.local')
    reported = await createPrincipal('moderation-reported@test.local')
    admin = await createPrincipal('moderation-admin@test.local')
    nonAdmin = await createPrincipal('moderation-non-admin@test.local')

    const { error: adminError } = await service
      .from('profiles')
      .update({ is_admin: true, is_suspended: false })
      .eq('id', admin.id)
    if (adminError) throw adminError

    const { data: report, error: reportError } = await service
      .from('reports')
      .insert({
        reporter_user_id: reporter.id,
        reported_user_id: reported.id,
        type: 'boundary_violation',
        severity: 'high',
        description: 'Moderation security regression fixture with sufficient detail.',
        status: 'pending',
      })
      .select('id')
      .single()
    if (reportError || !report) throw reportError ?? new Error('Failed to seed moderation report')
    reportId = report.id
  })

  async function authenticatedClient(user: User): Promise<SupabaseClient> {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error } = await client.auth.signInWithPassword({
      email: user.email!,
      password: 'Moderation-Security-123!',
    })
    if (error) throw error
    return client
  }

  it('denies moderation to a normal authenticated member', async () => {
    const client = await authenticatedClient(nonAdmin)
    const { error } = await client.rpc('moderate_report_for_trial', {
      p_report_id: reportId,
      p_status: 'resolved',
      p_action_taken: 'Invalid moderation attempt',
      p_suspend_reported_user: true,
    })
    expect(error).toBeTruthy()
  })

  it('rejects the retired caller-supplied admin identity signature', async () => {
    const client = await authenticatedClient(admin)
    const { error } = await client.rpc('moderate_report_for_trial', {
      p_report_id: reportId,
      p_admin_id: admin.id,
      p_status: 'investigating',
      p_action_taken: null,
      p_suspend_reported_user: false,
    })
    expect(error).toBeTruthy()
  })

  it('denies the service role access to the authenticated moderation wrapper', async () => {
    const { error } = await service.rpc('moderate_report_for_trial', {
      p_report_id: reportId,
      p_status: 'resolved',
      p_action_taken: 'Invalid service-role moderation attempt',
      p_suspend_reported_user: false,
    })
    expect(error).toBeTruthy()
  })

  it('atomically resolves, suspends, restricts, and audits when the authenticated admin acts', async () => {
    const outcome = 'Confirmed boundary violation during consumer-trial moderation burn.'
    const client = await authenticatedClient(admin)
    const { error } = await client.rpc('moderate_report_for_trial', {
      p_report_id: reportId,
      p_status: 'resolved',
      p_action_taken: outcome,
      p_suspend_reported_user: true,
    })
    expect(error).toBeNull()

    const [report, profile, restriction, audit] = await Promise.all([
      service.from('reports').select('status,action_taken,resolved_at').eq('id', reportId).single(),
      service.from('profiles').select('is_suspended').eq('id', reported.id).single(),
      service.from('restrictions').select('type,active,reason').eq('user_id', reported.id).eq('type', 'suspension').eq('active', true).single(),
      service.from('audit_events').select('action,target_id,actor_id').eq('action', 'report_moderated').eq('target_id', reportId).single(),
    ])

    expect(report.error).toBeNull()
    expect(report.data?.status).toBe('resolved')
    expect(report.data?.action_taken).toBe(outcome)
    expect(report.data?.resolved_at).toBeTruthy()
    expect(profile.data?.is_suspended).toBe(true)
    expect(restriction.data?.type).toBe('suspension')
    expect(restriction.data?.active).toBe(true)
    expect(audit.data?.actor_id).toBe(admin.id)
    expect(audit.data?.target_id).toBe(reportId)
  })
})
