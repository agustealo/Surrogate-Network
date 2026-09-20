import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProposalComposer } from '@/components/forms/ProposalComposer'
import { createClient } from '@/infrastructure/supabase/server'
import { routes } from '@/lib/routes'

type NeedDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function NeedDetailPage({ params }: NeedDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(routes.public.login)

  const { data: need, error } = await supabase
    .from('needs')
    .select('id,title,description,category,tags,location_mode,timing,boundaries,urgency,status,user_id,user_name,created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(`Failed to load Need: ${error.message}`)
  if (!need) notFound()

  const isOwner = need.user_id === user.id
  const { data: offers, error: offersError } = isOwner
    ? { data: [], error: null }
    : await supabase
        .from('offers')
        .select('id,title')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

  if (offersError) throw new Error(`Failed to load your Offers: ${offersError.message}`)

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline"><Link href="/discover">Back to Discover</Link></Button>
        {isOwner && <Badge variant="secondary">Your Need</Badge>}
      </div>
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap gap-2"><Badge variant="outline">{need.category}</Badge><Badge variant="outline">{need.location_mode}</Badge><Badge>{need.status}</Badge></div>
          <CardTitle className="text-3xl">{need.title}</CardTitle>
          <p className="text-sm text-muted-foreground">Requested by <Link className="underline" href={routes.memberDynamic.profile(need.user_id)}>{need.user_name}</Link> · {new Date(need.created_at).toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="whitespace-pre-wrap">{need.description}</p>
          {need.timing && <p><span className="font-medium">Timing:</span> {need.timing}</p>}
          {need.urgency && <p><span className="font-medium">Urgency:</span> {need.urgency}</p>}
          <div className="flex flex-wrap gap-2">{(need.boundaries ?? []).map((boundary) => <Badge key={boundary} variant="secondary">{boundary}</Badge>)}</div>
          <div className="flex flex-wrap gap-2">{(need.tags ?? []).map((tag) => <Badge key={tag} variant="outline">#{tag}</Badge>)}</div>
        </CardContent>
      </Card>
      {!isOwner && need.status === 'active' && <ProposalComposer needId={need.id} options={offers ?? []} />}
      {!isOwner && need.status !== 'active' && <p className="rounded-md border p-4 text-muted-foreground">This Need is no longer accepting proposals.</p>}
    </div>
  )
}
