import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProposalComposer } from '@/components/forms/ProposalComposer'
import { createClient } from '@/infrastructure/supabase/server'
import { routes } from '@/lib/routes'

type OfferDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function OfferDetailPage({ params }: OfferDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(routes.public.login)

  const { data: offer, error } = await supabase
    .from('offers')
    .select('id,title,description,category,location_mode,timing,boundaries,capacity,current_capacity,status,user_id,user_name,rating,review_count,created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(`Failed to load Offer: ${error.message}`)
  if (!offer) notFound()

  const isOwner = offer.user_id === user.id
  const { data: needs, error: needsError } = isOwner
    ? { data: [], error: null }
    : await supabase
        .from('needs')
        .select('id,title')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

  if (needsError) throw new Error(`Failed to load your Needs: ${needsError.message}`)

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline"><Link href="/discover">Back to Discover</Link></Button>
        {isOwner && <Badge variant="secondary">Your Offer</Badge>}
      </div>
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap gap-2"><Badge variant="outline">{offer.category}</Badge><Badge variant="outline">{offer.location_mode}</Badge><Badge>{offer.status}</Badge></div>
          <CardTitle className="text-3xl">{offer.title}</CardTitle>
          <p className="text-sm text-muted-foreground">Offered by <Link className="underline" href={routes.memberDynamic.profile(offer.user_id)}>{offer.user_name}</Link> · {new Date(offer.created_at).toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="whitespace-pre-wrap">{offer.description}</p>
          {offer.timing && <p><span className="font-medium">Timing:</span> {offer.timing}</p>}
          {offer.capacity && <p><span className="font-medium">Capacity:</span> {offer.current_capacity ?? 0} / {offer.capacity}</p>}
          {typeof offer.rating === 'number' && <p><span className="font-medium">Rating:</span> {offer.rating.toFixed(1)} from {offer.review_count ?? 0} reviews</p>}
          <div className="flex flex-wrap gap-2">{(offer.boundaries ?? []).map((boundary) => <Badge key={boundary} variant="secondary">{boundary}</Badge>)}</div>
        </CardContent>
      </Card>
      {!isOwner && offer.status === 'active' && <ProposalComposer offerId={offer.id} options={needs ?? []} />}
      {!isOwner && offer.status !== 'active' && <p className="rounded-md border p-4 text-muted-foreground">This Offer is no longer accepting proposals.</p>}
    </div>
  )
}
