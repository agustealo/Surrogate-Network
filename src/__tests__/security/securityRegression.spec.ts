import { beforeAll, describe, expect, it } from '@jest/globals'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

type Principal = {
  user: User
  email: string
  password: string
}

type PairFixture = {
  needId: string
  offerId: string
}

describe('Consumer-trial security regression', () => {
  let url: string
  let anonKey: string
  let serviceRoleKey: string
  let service: SupabaseClient
  let userA: Principal
  let userB: Principal
  let userC: Principal
  let adminUser: Principal

  const createPrincipal = async (email: string, password: string): Promise<Principal> => {
    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error || !data.user) throw error ?? new Error(`Failed to create ${email}`)
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

  const seedPair = async (label: string): Promise<PairFixture> => {
    const { data: need, error: needError } = await service
      .from('needs')
      .insert({
        title: `Need ${label}`,
        description: `Security regression need ${label}`,
        category: 'personal',
        user_id: userB.user.id,
        user_name: 'Security User B',
        boundaries: ['platonic'],
        location_mode: 'remote',
        status: 'active',
      })
      .select('id')
      .single()
    if (needError || !need) throw needError ?? new Error('Failed to seed Need')

    const { data: offer, error: offerError } = await service
      .from('offers')
      .insert({
        title: `Offer ${label}`,
        description: `Security regression offer ${label}`,
        category: 'personal',
        user_id: userA.user.id,
        user_name: 'Security User A',
        boundaries: ['platonic'],
        location_mode: 'remote',
        status: 'active',
        capacity: 5,
        current_capacity: 0,
      })
      .select('id')
      .single()
    if (offerError || !offer) throw offerError ?? new Error('Failed to seed Offer')

    return { needId: need.id, offerId: offer.id }
  }

  const createProposalAsA = async (pair: PairFixture): Promise<string> => {
    const clientA = await clientFor(userA)
    const { data, error } = await clientA
      .from('proposals')
      .insert({
        need_id: pair.needId,
        offer_id: pair.offerId,
        proposing_user_id: userA.user.id,
        receiving_user_id: userB.user.id,
        status: 'pending',
      })
      .select('id')
      .single()
    if (error || !data) throw error ?? new Error('Failed to create proposal as User A')
    return data.id
  }

  beforeAll(async () => {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    if (!url || !anonKey || !serviceRoleKey) {
      throw new Error('Security tests require the local Supabase runtime credentials')
    }

    service = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    userA = await createPrincipal('security-a@test.local', 'Trial-Security-A-123!')
    userB = await createPrincipal('security-b@test.local', 'Trial-Security-B-456!')
    userC = await createPrincipal('security-c@test.local', 'Trial-Security-C-789!')
    adminUser = await createPrincipal('security-admin@test.local', 'Trial-Security-Admin-123!')

    const { error: profileError } = await service
      .from('profiles')
      .update({
        name: 'Security Admin',
        is_admin: true,
        is_suspended: false,
      })
      .eq('id', adminUser.user.id)
    if (profileError) throw profileError
  })

  describe('privileged function boundary', () => {
    it('denies authenticated callers from token and XP mutation RPCs', async () => {
      const clientA = await clientFor(userA)
      const tokenAttempt = await clientA.rpc('update_token_balance', {
        p_user_id: userA.user.id,
        p_amount: 100000,
        p_reason: 'unauthorized self grant',
        p_transaction_type: 'earned',
      })
      const xpAttempt = await clientA.rpc('update_user_xp', {
        p_user_id: userA.user.id,
        p_amount: 100000,
        p_source: 'login',
        p_description: 'unauthorized self grant',
      })

      expect(tokenAttempt.error).toBeTruthy()
      expect(xpAttempt.error).toBeTruthy()
    })

    it('denies anonymous execution inherited through PUBLIC', async () => {
      const anonymous = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { error } = await anonymous.rpc('update_token_balance', {
        p_user_id: userA.user.id,
        p_amount: 1,
        p_reason: 'anonymous attempt',
        p_transaction_type: 'earned',
      })
      expect(error).toBeTruthy()
    })
  })

  describe('profile privacy and authoritative fields', () => {
    it('does not expose another member profile row or email', async () => {
      const clientA = await clientFor(userA)
      const { data, error } = await clientA
        .from('profiles')
        .select('id,email,name')
        .eq('id', userB.user.id)
        .maybeSingle()

      expect(error).toBeNull()
      expect(data).toBeNull()
    })

    it('allows a member to read their own private profile row', async () => {
      const clientA = await clientFor(userA)
      const { data, error } = await clientA
        .from('profiles')
        .select('id,email')
        .eq('id', userA.user.id)
        .single()

      expect(error).toBeNull()
      expect(data?.email).toBe(userA.email)
    })

    it('exposes only the safe cross-member public projection', async () => {
      const clientA = await clientFor(userA)
      const { data, error } = await clientA
        .from('public_profiles')
        .select('*')
        .eq('id', userB.user.id)
        .single()

      expect(error).toBeNull()
      expect(data?.id).toBe(userB.user.id)
      expect(data).not.toHaveProperty('email')
      expect(data).not.toHaveProperty('token_balance')
      expect(data).not.toHaveProperty('xp')
      expect(data).not.toHaveProperty('is_admin')
      expect(data).not.toHaveProperty('is_suspended')
    })

    it('blocks self-mutation of authoritative profile fields', async () => {
      const clientA = await clientFor(userA)
      for (const mutation of [
        { rank: 999 },
        { xp: 999999 },
        { token_balance: 999999 },
        { verification_status: 'fully_verified' },
        { is_suspended: false },
      ]) {
        const { error } = await clientA.from('profiles').update(mutation).eq('id', userA.user.id)
        expect(error).toBeTruthy()
      }
    })

    it('blocks owners from mutating Offer capacity and reputation counters', async () => {
      const pair = await seedPair('offer-authority')
      const clientA = await clientFor(userA)
      const { error } = await clientA
        .from('offers')
        .update({ current_capacity: 4, rating: 5, review_count: 999 })
        .eq('id', pair.offerId)

      expect(error).toBeTruthy()
    })
  })

  describe('proposal authority', () => {
    it('allows a valid proposer to create a pending proposal', async () => {
      const pair = await seedPair('proposal-create')
      const proposalId = await createProposalAsA(pair)
      expect(proposalId).toEqual(expect.any(String))
    })

    it('denies direct client status updates for both participants', async () => {
      const pair = await seedPair('proposal-direct-update')
      const proposalId = await createProposalAsA(pair)

      const clientA = await clientFor(userA)
      const clientB = await clientFor(userB)
      const proposerAttempt = await clientA.from('proposals').update({ status: 'accepted' }).eq('id', proposalId)
      const recipientAttempt = await clientB.from('proposals').update({ status: 'accepted' }).eq('id', proposalId)

      expect(proposerAttempt.error).toBeTruthy()
      expect(recipientAttempt.error).toBeTruthy()
    })

    it('denies authenticated clients from invoking the server-only acceptance RPC', async () => {
      const pair = await seedPair('proposal-rpc-client')
      const proposalId = await createProposalAsA(pair)
      const clientB = await clientFor(userB)
      const { error } = await clientB.rpc('accept_proposal_for_trial', {
        p_proposal_id: proposalId,
        p_actor_id: userB.user.id,
      })

      expect(error).toBeTruthy()
    })

    it('rejects proposer and unrelated actors even through trusted server execution', async () => {
      const pair = await seedPair('proposal-actor-check')
      const proposalId = await createProposalAsA(pair)

      const proposerAttempt = await service.rpc('accept_proposal_for_trial', {
        p_proposal_id: proposalId,
        p_actor_id: userA.user.id,
      })
      const unrelatedAttempt = await service.rpc('accept_proposal_for_trial', {
        p_proposal_id: proposalId,
        p_actor_id: userC.user.id,
      })

      expect(proposerAttempt.error).toBeTruthy()
      expect(unrelatedAttempt.error).toBeTruthy()
    })

    it('atomically accepts as recipient and creates the relationship graph', async () => {
      const pair = await seedPair('proposal-accept')
      const proposalId = await createProposalAsA(pair)
      const { data: surrogacyId, error } = await service.rpc('accept_proposal_for_trial', {
        p_proposal_id: proposalId,
        p_actor_id: userB.user.id,
      })

      expect(error).toBeNull()
      expect(surrogacyId).toEqual(expect.any(String))

      const [proposal, relationship, participants, need, offer] = await Promise.all([
        service.from('proposals').select('status').eq('id', proposalId).single(),
        service.from('surrogacies').select('id,status,partner_ids').eq('id', surrogacyId).single(),
        service.from('surrogacy_participants').select('user_id').eq('surrogacy_id', surrogacyId),
        service.from('needs').select('status').eq('id', pair.needId).single(),
        service.from('offers').select('current_capacity').eq('id', pair.offerId).single(),
      ])

      expect(proposal.data?.status).toBe('accepted')
      expect(relationship.data?.status).toBe('active')
      expect(new Set(relationship.data?.partner_ids ?? [])).toEqual(new Set([userA.user.id, userB.user.id]))
      expect(new Set((participants.data ?? []).map((row) => row.user_id))).toEqual(new Set([userA.user.id, userB.user.id]))
      expect(need.data?.status).toBe('fulfilled')
      expect(offer.data?.current_capacity).toBe(1)
    })

    it('prevents a blocked pair from advancing an already-open proposal', async () => {
      const pair = await seedPair('proposal-blocked')
      const proposalId = await createProposalAsA(pair)
      const { error: blockError } = await service.from('blocks').insert({
        blocker_user_id: userB.user.id,
        blocked_user_id: userA.user.id,
      })
      if (blockError) throw blockError

      const { error } = await service.rpc('accept_proposal_for_trial', {
        p_proposal_id: proposalId,
        p_actor_id: userB.user.id,
      })
      expect(error).toBeTruthy()

      await service
        .from('blocks')
        .delete()
        .eq('blocker_user_id', userB.user.id)
        .eq('blocked_user_id', userA.user.id)
    })
  })

  describe('suspension, reports, and notifications', () => {
    it('blocks suspended members at the database operation boundary', async () => {
      const { error: suspendError } = await service
        .from('profiles')
        .update({ is_suspended: true })
        .eq('id', userC.user.id)
      if (suspendError) throw suspendError

      const clientC = await clientFor(userC)
      const { error } = await clientC.from('needs').insert({
        title: 'Suspended Need',
        description: 'This write must be denied by restrictive RLS.',
        category: 'personal',
        user_id: userC.user.id,
        user_name: 'Security User C',
        boundaries: ['platonic'],
        location_mode: 'remote',
      })
      expect(error).toBeTruthy()

      await service.from('profiles').update({ is_suspended: false }).eq('id', userC.user.id)
    })

    it('makes member-submitted report workflow fields immutable to the reporter', async () => {
      const clientA = await clientFor(userA)
      const { data: report, error: createError } = await clientA
        .from('reports')
        .insert({
          reporter_user_id: userA.user.id,
          reported_user_id: userC.user.id,
          type: 'other',
          severity: 'medium',
          description: 'Security regression report with enough detail.',
          status: 'pending',
        })
        .select('id')
        .single()
      expect(createError).toBeNull()
      expect(report?.id).toEqual(expect.any(String))

      const { error: mutateError } = await clientA
        .from('reports')
        .update({ status: 'dismissed', resolution: 'self dismissed' })
        .eq('id', report!.id)
      expect(mutateError).toBeTruthy()
    })

    it('allows only the read flag to be changed on a member notification', async () => {
      const { data: notification, error: seedError } = await service
        .from('notifications')
        .insert({
          user_id: userA.user.id,
          type: 'system',
          title: 'Original title',
          message: 'Original message',
          read: false,
        })
        .select('id')
        .single()
      if (seedError || !notification) throw seedError ?? new Error('Failed to seed notification')

      const clientA = await clientFor(userA)
      const markRead = await clientA.from('notifications').update({ read: true }).eq('id', notification.id)
      const rewrite = await clientA.from('notifications').update({ title: 'Forged title' }).eq('id', notification.id)

      expect(markRead.error).toBeNull()
      expect(rewrite.error).toBeTruthy()
    })
  })

  describe('admin authority', () => {
    it('rejects non-admin authoritative profile mutation', async () => {
      const clientA = await clientFor(userA)
      const { error } = await clientA.rpc('admin_update_profile', {
        p_id: userB.user.id,
        p_name: 'Unauthorized admin change',
      })
      expect(error).toBeTruthy()
    })

    it('allows an authenticated unsuspended admin through the verified RPC', async () => {
      const adminClient = await clientFor(adminUser)
      const { error } = await adminClient.rpc('admin_update_profile', {
        p_id: userB.user.id,
        p_name: 'Security User B',
        p_xp: 100,
      })
      expect(error).toBeNull()
    })
  })

  describe('audit preservation', () => {
    it('preserves audit evidence when its actor account is deleted', async () => {
      const disposable = await createPrincipal('security-audit@test.local', 'Trial-Security-Audit-123!')
      const { data: auditEvent, error: insertError } = await service
        .from('audit_events')
        .insert({
          actor_id: disposable.user.id,
          action: 'security_test_action',
          target_id: 'security-test-target',
          target_type: 'security-test',
        })
        .select('id')
        .single()
      if (insertError || !auditEvent) throw insertError ?? new Error('Failed to seed audit event')

      const { error: deleteError } = await service.auth.admin.deleteUser(disposable.user.id)
      if (deleteError) throw deleteError

      const { data: preserved, error: readError } = await service
        .from('audit_events')
        .select('id,actor_id,action')
        .eq('id', auditEvent.id)
        .single()

      expect(readError).toBeNull()
      expect(preserved?.actor_id).toBeNull()
      expect(preserved?.action).toBe('security_test_action')
    })
  })
})
