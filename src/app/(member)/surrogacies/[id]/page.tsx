import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FeedbackForm } from '@/components/forms/FeedbackForm'
import { MomentActions } from '@/components/connections/MomentActions'
import { MomentScheduler } from '@/components/connections/MomentScheduler'
import { createClient } from '@/infrastructure/supabase/server'
import { routes } from '@/lib/routes'

type SurrogacyDetailPageProps = {
  params: Promise<{ id: string }>
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : 'date unavailable'
}

function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : 'time unavailable'
}

export default async function SurrogacyDetailPage({ params }: SurrogacyDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(routes.public.login)

  const { data: relationship, error: relationshipError } = await supabase
    .from('surrogacies')
    .select('id,need_id,offer_id,partner_ids,status,started_at,ended_at,agreement')
    .eq('id', id)
    .maybeSingle()

  if (relationshipError) throw new Error(`Failed to load relationship: ${relationshipError.message}`)
  if (!relationship) notFound()

  const [{ data: need, error: needError }, { data: offer, error: offerError }, momentsResult, exchangesResult] = await Promise.all([
    supabase.from('needs').select('id,title,user_id,user_name').eq('id', relationship.need_id).single(),
    supabase.from('offers').select('id,title,user_id,user_name').eq('id', relationship.offer_id).single(),
    supabase.from('moments').select('id,scheduled_time,duration,status,location,notes,created_at').eq('surrogacy_id', id).order('scheduled_time', { ascending: false }),
    supabase.from('exchanges').select('id,moment_id,status,completed_at').eq('surrogacy_id', id).order('completed_at', { ascending: false }),
  ])

  if (needError || !need) throw new Error('The Need attached to this relationship is unavailable.')
  if (offerError || !offer) throw new Error('The Offer attached to this relationship is unavailable.')
  if (momentsResult.error) throw new Error(`Failed to load Moments: ${momentsResult.error.message}`)
  if (exchangesResult.error) throw new Error(`Failed to load Exchanges: ${exchangesResult.error.message}`)

  const exchangeIds = (exchangesResult.data ?? []).map((exchange) => exchange.id)
  const feedbackResult = exchangeIds.length
    ? await supabase.from('feedback').select('id,exchange_id,from_user_id').eq('from_user_id', user.id).in('exchange_id', exchangeIds)
    : { data: [], error: null }
  if (feedbackResult.error) throw new Error(`Failed to load Feedback state: ${feedbackResult.error.message}`)

  const exchangeByMoment = new Map((exchangesResult.data ?? []).map((exchange) => [exchange.moment_id, exchange]))
  const reviewedExchangeIds = new Set((feedbackResult.data ?? []).map((feedback) => feedback.exchange_id))
  const otherUserId = relationship.partner_ids.find((partnerId) => partnerId !== user.id)
  if (!otherUserId) throw new Error('Relationship participant data is incomplete.')
  const otherName = need.user_id === otherUserId ? need.user_name : offer.user_name

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline"><Link href="/surrogacies">Back to Connections</Link></Button>
        <Badge>{relationship.status}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-3xl">{need.title} ↔ {offer.title}</CardTitle><CardDescription>Connected with {otherName} since {formatDate(relationship.started_at)}.</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><Link href={`/needs/${need.id}`}>View Need</Link></Button><Button asChild size="sm" variant="outline"><Link href={`/offers/${offer.id}`}>View Offer</Link></Button></CardContent>
      </Card>

      {relationship.status === 'active' && <MomentScheduler surrogacyId={relationship.id} />}

      <section className="space-y-4">
        <div><h2 className="text-2xl font-semibold">Moments & Exchanges</h2><p className="text-muted-foreground">The operational history of this relationship.</p></div>
        {!(momentsResult.data ?? []).length && <p className="rounded-md border p-4 text-muted-foreground">No Moments scheduled yet.</p>}
        {(momentsResult.data ?? []).map((moment) => {
          const exchange = exchangeByMoment.get(moment.id)
          const canReview = exchange && (exchange.status === 'completed' || exchange.status === 'partial') && !reviewedExchangeIds.has(exchange.id)
          return (
            <Card key={moment.id}>
              <CardHeader>
                <div className="flex flex-wrap gap-2"><Badge variant="outline">Moment: {moment.status}</Badge>{exchange && <Badge>Exchange: {exchange.status}</Badge>}</div>
                <CardTitle>{new Date(moment.scheduled_time).toLocaleString()}</CardTitle>
                <CardDescription>{moment.duration} minutes{moment.location ? ` · ${moment.location}` : ''}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {moment.notes && <p className="whitespace-pre-wrap text-sm">{moment.notes}</p>}
                {moment.status === 'scheduled' && !exchange && <MomentActions momentId={moment.id} surrogacyId={relationship.id} />}
                {exchange && <p className="text-sm text-muted-foreground">Recorded {formatDateTime(exchange.completed_at)}.</p>}
                {canReview && <FeedbackForm exchangeId={exchange.id} toUserId={otherUserId} companionName={otherName} />}
                {exchange && reviewedExchangeIds.has(exchange.id) && <p className="text-sm text-muted-foreground">You submitted feedback for this Exchange.</p>}
              </CardContent>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
