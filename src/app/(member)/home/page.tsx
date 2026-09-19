import Link from 'next/link'
import { Heart, Handshake, Users } from 'lucide-react'
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
    { label: 'Active Surrogacies', value: surrogaciesResult.count ?? 0, icon: Users, href: routes.member.surrogacies },
  ]

  return <div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
    <div><h1 className="text-3xl font-bold">Your network</h1><p className="text-muted-foreground">Live activity from your Surrogate account.</p></div>
    <div className="grid gap-4 md:grid-cols-3">{stats.map(({label,value,icon:Icon,href}) => <Card key={label}><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-4 w-4" />{label}</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{value}</div><Button variant="link" className="px-0" asChild><Link href={href}>View</Link></Button></CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle>Progress</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">Rank {progressionResult.data?.current_rank ?? 1}</p><p className="text-muted-foreground">{progressionResult.data?.total_xp ?? 0} XP earned</p></CardContent></Card>
    <div className="flex flex-wrap gap-3"><Button asChild><Link href={routes.member.needsCreate}>Create a Need</Link></Button><Button variant="outline" asChild><Link href={routes.member.offers}>Manage Offers</Link></Button><Button variant="outline" asChild><Link href={routes.member.discover}>Discover</Link></Button></div>
  </div>
}
