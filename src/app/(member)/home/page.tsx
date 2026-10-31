import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Heart, Handshake, Trophy, Users, Compass, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/infrastructure/supabase/server'
import { routes } from '@/lib/routes'
import { selectHomeActions } from '@/application/services/HomeNextActionService'

export default async function MemberHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(routes.public.login)

  const [needsResult, offersResult, surrogaciesResult, progressionResult, proposalsResult] = await Promise.all([
    supabase.from('needs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
    supabase.from('offers').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
    supabase.from('surrogacies').select('id,status,started_at', { count: 'exact' }).contains('partner_ids', [user.id]).eq('status', 'active'),
    supabase.from('member_progression').select('current_rank,total_xp').eq('user_id', user.id).maybeSingle(),
    supabase.from('proposals').select('id,status,proposing_user_id,receiving_user_id,countered_by_user_id,created_at')
      .or(`proposing_user_id.eq.${user.id},receiving_user_id.eq.${user.id}`)
      .in('status', ['pending', 'countered']).order('created_at', { ascending: false }).limit(100),
  ])

  const failed = [needsResult, offersResult, surrogaciesResult, progressionResult, proposalsResult].find(result => result.error)
  if (failed?.error) throw new Error(`Failed to load member dashboard: ${failed.error.message}`)

  const connections = surrogaciesResult.data ?? []
  const connectionIds = connections.map(item => item.id)

  const [momentsResult, exchangesResult] = await Promise.all([
    connectionIds.length
      ? supabase.from('moments').select('id,surrogacy_id,status,scheduled_time')
        .in('surrogacy_id', connectionIds).in('status', ['scheduled', 'in_progress']).order('scheduled_time', { ascending: true }).limit(100)
      : Promise.resolve({ data: [], error: null }),
    connectionIds.length
      ? supabase.from('exchanges').select('id,surrogacy_id,status,completed_at')
        .in('surrogacy_id', connectionIds).in('status', ['completed', 'partial']).order('completed_at', { ascending: false }).limit(100)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (momentsResult.error) throw new Error(`Failed to load your Moments: ${momentsResult.error.message}`)
  if (exchangesResult.error) throw new Error(`Failed to load your Exchanges: ${exchangesResult.error.message}`)

  const exchangeIds = (exchangesResult.data ?? []).map(item => item.id)
  const feedbackResult = exchangeIds.length
    ? await supabase.from('feedback').select('exchange_id').eq('from_user_id', user.id).in('exchange_id', exchangeIds)
    : { data: [], error: null }
  if (feedbackResult.error) throw new Error(`Failed to load your Feedback: ${feedbackResult.error.message}`)

  const actions = selectHomeActions({
    userId: user.id,
    proposals: proposalsResult.data ?? [],
    connections,
    moments: momentsResult.data ?? [],
    exchanges: exchangesResult.data ?? [],
    reviewedExchangeIds: new Set((feedbackResult.data ?? []).map(item => item.exchange_id)),
  }).slice(0, 5)

  const stats = [
    { label: 'Open Needs', value: needsResult.count ?? 0, icon: Heart, href: routes.member.needs },
    { label: 'Active Offers', value: offersResult.count ?? 0, icon: Handshake, href: routes.member.offers },
    { label: 'Active Connections', value: surrogaciesResult.count ?? 0, icon: Users, href: routes.member.surrogacies },
  ]

  const hasActivity = (needsResult.count ?? 0) + (offersResult.count ?? 0) + (surrogaciesResult.count ?? 0) > 0
    || (proposalsResult.data ?? []).length > 0
  const rank = progressionResult.data?.current_rank ?? 1
  const totalXp = progressionResult.data?.total_xp ?? 0

  return <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
    <div><h1 className="text-3xl font-bold">Your network</h1><p className="text-muted-foreground">Real connections and the next steps that matter.</p></div>
    {!hasActivity && (
      <section aria-labelledby="first-step-heading" className="space-y-4">
        <div>
          <h2 id="first-step-heading" className="text-xl font-semibold">Your first connection starts here</h2>
          <p className="text-muted-foreground">Tell the community what you need, offer something you can share, or explore what's already available.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Heart className="h-5 w-5 text-primary" aria-hidden="true" />Share a Need</CardTitle></CardHeader>
            <CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Ask for companionship, skills, or support.</p><Button asChild><Link href={routes.member.needsCreate}>Create a Need</Link></Button></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Handshake className="h-5 w-5 text-primary" aria-hidden="true" />Offer to help</CardTitle></CardHeader>
            <CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Share what you're willing and able to give.</p><Button asChild variant="outline"><Link href={routes.member.offersCreate}>Create an Offer</Link></Button></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Compass className="h-5 w-5 text-primary" aria-hidden="true" />Look around</CardTitle></CardHeader>
            <CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Find Needs and Offers that interest you.</p><Button asChild variant="outline"><Link href={routes.member.discover}>Explore Discover</Link></Button></CardContent></Card>
        </div>
        <Button asChild variant="link" className="px-0"><Link href={routes.member.profileCreate}>See the getting-started guide</Link></Button>
      </section>
    )}

    {hasActivity && (
      <section aria-labelledby="next-actions-heading" className="space-y-4">
        <div><h2 id="next-actions-heading" className="text-xl font-semibold">Your next steps</h2>
          <p className="text-sm text-muted-foreground">A few highlights from your real Proposals, Connections and Moments. Open each item for its available actions.</p></div>
        {actions.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {actions.map(action => (
              <Card key={action.key}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{action.title}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                  <Button asChild size="sm" variant="outline"><Link href={action.href}>{action.label}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card><CardContent className="py-5 space-y-3">
            <p className="text-sm text-muted-foreground">Nothing requiring your attention in these recent activities. Explore new opportunities or review all your Connections and Proposals.</p>
            <Button asChild variant="outline"><Link href={routes.member.discover}>Discover opportunities</Link></Button>
          </CardContent></Card>
        )}
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="link" className="px-0"><Link href={routes.member.proposals}>All Proposals</Link></Button>
          <Button asChild variant="link" className="px-0"><Link href={routes.member.surrogacies}>All Connections</Link></Button>
        </div>
      </section>
    )}

    <section aria-labelledby="activity-heading" className="space-y-4">
      <h2 id="activity-heading" className="text-xl font-semibold">Your activity at a glance</h2>
      <div className="grid gap-4 md:grid-cols-3">{stats.map(({ label, value, icon: Icon, href }) =>
        <Card key={label}><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-4 w-4" aria-hidden="true" />{label}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{value}</div><Button variant="link" className="px-0" asChild><Link href={href}>View</Link></Button></CardContent></Card>)}
      </div>
    </section>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" aria-hidden="true" />Rewards & Progress</CardTitle></CardHeader>
      <CardContent className="space-y-2"><p className="text-2xl font-semibold">Rank {rank}</p>
        <p className="text-muted-foreground">{totalXp.toLocaleString()} XP earned</p>
        <Button variant="link" className="px-0" asChild><Link href={routes.member.rewards}>View rewards and XP activity</Link></Button>
      </CardContent></Card>
  </div>
}
