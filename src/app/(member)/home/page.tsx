import Link from 'next/link'
import { Heart, Handshake, Trophy, Users, Compass } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/infrastructure/supabase/server'
import { routes } from '@/lib/routes'

export default async function MemberHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [needsResult, offersResult, surrogaciesResult, progressionResult] = await Promise.all([
    supabase.from('needs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
    supabase.from('offers').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
    supabase.from('surrogacies').select('id', { count: 'exact', head: true }).contains('partner_ids', [user.id]).eq('status', 'active'),
    supabase.from('member_progression').select('current_rank,total_xp').eq('user_id', user.id).maybeSingle(),
  ])

  const failed = [needsResult, offersResult, surrogaciesResult, progressionResult].find(result => result.error)
  if (failed?.error) throw new Error(`Failed to load member dashboard: ${failed.error.message}`)

  const stats = [
    { label: 'Open Needs', value: needsResult.count ?? 0, icon: Heart, href: routes.member.needs },
    { label: 'Active Offers', value: offersResult.count ?? 0, icon: Handshake, href: routes.member.offers },
    { label: 'Active Connections', value: surrogaciesResult.count ?? 0, icon: Users, href: routes.member.surrogacies },
  ]

  const hasActivity = (needsResult.count ?? 0) + (offersResult.count ?? 0) + (surrogaciesResult.count ?? 0) > 0

  const rank = progressionResult.data?.current_rank ?? 1
  const totalXp = progressionResult.data?.total_xp ?? 0

  return <div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
    <div><h1 className="text-3xl font-bold">Your network</h1><p className="text-muted-foreground">Your live activity, connections, and progress in one place.</p></div>
    {!hasActivity && (
      <section aria-labelledby="first-step-heading" className="space-y-4">
        <div>
          <h2 id="first-step-heading" className="text-xl font-semibold">Your first connection starts here</h2>
          <p className="text-muted-foreground">Tell the community what you need, offer something you can share, or explore what's already available.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Heart className="h-5 w-5 text-primary" aria-hidden="true" />Share a Need</CardTitle></CardHeader>
            <CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Ask for companionship, skills, or support.</p><Button asChild><Link href={routes.member.needsCreate}>Create a Need</Link></Button></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Handshake className="h-5 w-5 text-primary" aria-hidden="true" />Offer to help</CardTitle></CardHeader>
            <CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Share what you're willing and able to give.</p><Button asChild variant="outline"><Link href={routes.member.offersCreate}>Create an Offer</Link></Button></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Compass className="h-5 w-5 text-primary" aria-hidden="true" />Look around</CardTitle></CardHeader>
            <CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Find Needs and Offers that interest you.</p><Button asChild variant="outline"><Link href={routes.member.discover}>Explore Discover</Link></Button></CardContent>
          </Card>
        </div>
        <Button asChild variant="link" className="px-0"><Link href={routes.member.profileCreate}>See the getting-started guide</Link></Button>
      </section>
    )}
    {hasActivity && (
      <section aria-labelledby="continue-heading" className="space-y-3">
        <h2 id="continue-heading" className="text-xl font-semibold">Keep your connections moving</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link href={routes.member.proposals}>Review proposals</Link></Button>
          <Button asChild variant="outline"><Link href={routes.member.surrogacies}>Your connections</Link></Button>
          <Button asChild variant="outline"><Link href={routes.member.discover}>Discover more</Link></Button>
        </div>
      </section>
    )}
    <h2 className="text-xl font-semibold">Your activity at a glance</h2>
    <div className="grid gap-4 md:grid-cols-3">{stats.map(({ label, value, icon: Icon, href }) => <Card key={label}><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-4 w-4" />{label}</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{value}</div><Button variant="link" className="px-0" asChild><Link href={href}>View</Link></Button></CardContent></Card>)}</div>
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" />Rewards & Progress</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-semibold">Rank {rank}</p>
        <p className="text-muted-foreground">{totalXp.toLocaleString()} XP earned</p>
        <Button variant="link" className="px-0" asChild><Link href={routes.member.rewards}>View rewards and XP activity</Link></Button>
      </CardContent>
    </Card>

  </div>
}
