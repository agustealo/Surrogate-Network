import { createClient, createServiceClient } from '@/infrastructure/supabase/server'

function assertQuery(label: string, error: { message: string } | null) {
  if (error) throw new Error(`${label}: ${error.message}`)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const service = createServiceClient()

  try {
    const [
      profile,
      needs,
      offers,
      proposals,
      surrogacies,
      feedback,
      blocks,
      reports,
      notifications,
      tokenTransactions,
      xpTransactions,
      progression,
    ] = await Promise.all([
      service.from('profiles').select('*').eq('id', user.id).single(),
      service.from('needs').select('*').eq('user_id', user.id).order('created_at'),
      service.from('offers').select('*').eq('user_id', user.id).order('created_at'),
      service.from('proposals').select('*').or(`proposing_user_id.eq.${user.id},receiving_user_id.eq.${user.id}`).order('created_at'),
      service.from('surrogacies').select('*').contains('partner_ids', [user.id]).order('started_at'),
      service.from('feedback').select('*').or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`).order('created_at'),
      service.from('blocks').select('id,blocked_user_id,created_at').eq('blocker_user_id', user.id).order('created_at'),
      service.from('reports').select('id,reported_user_id,type,severity,description,status,created_at,resolved_at').eq('reporter_user_id', user.id).order('created_at'),
      service.from('notifications').select('*').eq('user_id', user.id).order('created_at'),
      service.from('token_transactions').select('*').eq('user_id', user.id).order('created_at'),
      service.from('xp_transactions').select('*').eq('user_id', user.id).order('created_at'),
      service.from('member_progression').select('*').eq('user_id', user.id).maybeSingle(),
    ])

    const baseResults = [
      ['profile', profile.error],
      ['needs', needs.error],
      ['offers', offers.error],
      ['proposals', proposals.error],
      ['surrogacies', surrogacies.error],
      ['feedback', feedback.error],
      ['blocks', blocks.error],
      ['reports', reports.error],
      ['notifications', notifications.error],
      ['token transactions', tokenTransactions.error],
      ['xp transactions', xpTransactions.error],
      ['progression', progression.error],
    ] as const
    for (const [label, error] of baseResults) assertQuery(label, error)

    const surrogacyIds = (surrogacies.data ?? []).map((row) => row.id)
    const moments = surrogacyIds.length
      ? await service.from('moments').select('*').in('surrogacy_id', surrogacyIds).order('created_at')
      : { data: [], error: null }
    assertQuery('moments', moments.error)

    const momentIds = (moments.data ?? []).map((row) => row.id)
    const exchanges = momentIds.length
      ? await service.from('exchanges').select('*').in('moment_id', momentIds).order('completed_at')
      : { data: [], error: null }
    assertQuery('exchanges', exchanges.error)

    const generatedAt = new Date().toISOString()
    const payload = {
      export_version: '2026-09-20',
      generated_at: generatedAt,
      account: {
        id: user.id,
        email: user.email ?? null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
      },
      profile: profile.data,
      needs: needs.data ?? [],
      offers: offers.data ?? [],
      proposals: proposals.data ?? [],
      surrogacies: surrogacies.data ?? [],
      moments: moments.data ?? [],
      exchanges: exchanges.data ?? [],
      feedback: feedback.data ?? [],
      blocks_created: blocks.data ?? [],
      reports_filed: reports.data ?? [],
      notifications: notifications.data ?? [],
      token_transactions: tokenTransactions.data ?? [],
      xp_transactions: xpTransactions.data ?? [],
      progression: progression.data,
      retention_note: 'Internal moderation, anti-abuse, audit, and security records are not included in this member export. Shared relationship records may be retained after account deletion in redacted or tombstoned form.',
    }

    const date = generatedAt.slice(0, 10)
    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="surrogate-network-export-${date}.json"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new Response('Account export could not be generated.', {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
