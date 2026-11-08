import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FeedbackForm } from '@/components/forms/FeedbackForm'
import { MomentActions } from '@/components/connections/MomentActions'
import { ExchangeConfirmationActions } from '@/components/connections/ExchangeConfirmationActions'
import { MomentScheduler } from '@/components/connections/MomentScheduler'
import { createClient } from '@/infrastructure/supabase/server'
import { routes } from '@/lib/routes'
import { connectionStatusLabel, displayConnectionAgreement, getConnectionNextStep } from '@/application/services/ConnectionExperienceService'

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
    supabase.from('exchanges').select('id,moment_id,status,completed_at,confirmation_state,recorded_by,confirmed_at').eq('surrogacy_id', id).order('completed_at', { ascending: false }),
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
  const agreement = displayConnectionAgreement(relationship.agreement)
  const nextStep = getConnectionNextStep({
    status: relationship.status,
    moments: momentsResult.data ?? [],
    exchanges: exchangesResult.data ?? [],
    reviewedExchangeIds,
  })

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline"><Link href="/surrogacies">Back to Connections</Link></Button>
        <Badge>{connectionStatusLabel(relationship.status)}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-3xl">{need.title} ↔ {offer.title}</CardTitle><CardDescription>Connected with {otherName} since {formatDate(relationship.started_at)}. This relationship originated from an accepted Proposal.</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><Link href={`/needs/${need.id}`}>View Need</Link></Button><Button asChild size="sm" variant="outline"><Link href={`/offers/${offer.id}`}>View Offer</Link></Button></CardContent>
      </Card>

      <section aria-labelledby="connection-next-step" className="space-y-3">
        <h2 id="connection-next-step" className="text-xl font-semibold">What happens next?</h2>
        <Card><CardHeader><CardTitle className="text-lg">{nextStep.heading}</CardTitle><CardDescription>{nextStep.description}</CardDescription></CardHeader></Card>
      </section>

      <section aria-labelledby="connection-agreement" className="space-y-3">
        <h2 id="connection-agreement" className="text-xl font-semibold">Shared expectations</h2>
        <Card><CardContent className="space-y-4 pt-6">
          {agreement ? (
            <dl className="space-y-3 text-sm">
              {agreement.boundaries.length > 0 && <div><dt className="font-semibold">Recorded boundaries</dt><dd className="text-muted-foreground">{agreement.boundaries.join(', ')}</dd></div>}
              {agreement.expectations.length > 0 && <div><dt className="font-semibold">Recorded expectations</dt><dd><ul className="list-disc space-y-1 pl-5">{agreement.expectations.map((item, index) => <li key={index}>{item}</li>)}</ul></dd></div>}
              {agreement.communicationMethod && <div><dt className="font-semibold">Recorded communication method</dt><dd className="text-muted-foreground">{agreement.communicationMethod}</dd></div>}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No structured agreement details are recorded for display. Review the original Need and Offer for their stated terms. Do not assume an unrecorded expectation was agreed.</p>
          )}
          <p className="text-xs text-muted-foreground">This section displays recorded information only. It does not create or modify consent, guarantees, or relationship terms.</p>
        </CardContent></Card>
      </section>

      {relationship.status === 'active' && <MomentScheduler surrogacyId={relationship.id} />}

      <section className="space-y-4">
        <div><h2 className="text-2xl font-semibold">Moments & Exchanges</h2><p className="text-muted-foreground">Scheduled experiences and the outcomes recorded together.</p></div>
        {!(momentsResult.data ?? []).length && <p className="rounded-md border p-4 text-muted-foreground">No Moments have been recorded for this Connection.</p>}
        {(momentsResult.data ?? []).map((moment) => {
          const exchange = exchangeByMoment.get(moment.id)
          const canReview = exchange && exchange.confirmation_state === 'confirmed' && (exchange.status === 'completed' || exchange.status === 'partial') && !reviewedExchangeIds.has(exchange.id)
          const pendingConfirmation = exchange?.confirmation_state === 'pending'
          const peerCanConfirm = pendingConfirmation && exchange.recorded_by !== user.id
          return (
            <Card key={moment.id}>
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Moment: {exchange?.confirmation_state === 'pending' ? 'outcome reported' : exchange?.confirmation_state === 'disputed' ? 'outcome disputed' : moment.status}</Badge>
                  {exchange && <Badge>{exchange.confirmation_state === 'pending' ? `Outcome reported: ${exchange.status}` : `Exchange: ${exchange.status}`}</Badge>}
                  {exchange && <Badge variant="secondary">{exchange.confirmation_state === 'confirmed' ? 'Confirmed by both participants' : exchange.confirmation_state === 'pending' ? 'Awaiting peer confirmation' : exchange.confirmation_state === 'disputed' ? 'Disputed' : 'Historical: not jointly verified'}</Badge>}
                </div>
                <CardTitle>{new Date(moment.scheduled_time).toLocaleString()}</CardTitle>
                <CardDescription>{moment.duration} minutes{moment.location ? ` · ${moment.location}` : ''}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {moment.notes && <p className="whitespace-pre-wrap text-sm">{moment.notes}</p>}
                {moment.status === 'scheduled' && !exchange && <MomentActions momentId={moment.id} surrogacyId={relationship.id} />}
                {exchange && <p className="text-sm text-muted-foreground">Recorded {formatDateTime(exchange.completed_at)}.{exchange.confirmed_at ? ` Both participants confirmed ${formatDateTime(exchange.confirmed_at)}.` : ''}</p>}
                {peerCanConfirm && (exchange.status === 'completed' || exchange.status === 'partial') && (
                  <ExchangeConfirmationActions exchangeId={exchange.id} surrogacyId={relationship.id} reportedStatus={exchange.status} />
                )}
                {pendingConfirmation && !peerCanConfirm && (
                  <p className="text-sm text-muted-foreground">You reported this outcome. The other participant has not confirmed it yet. Feedback, XP, and new achievements are unavailable until they confirm.</p>
                )}
                {exchange?.confirmation_state === 'disputed' && (
                  <p className="text-sm text-muted-foreground">This Exchange is disputed. It does not qualify for new rewards or feedback. Existing member safety and report controls remain available.</p>
                )}
                {exchange?.confirmation_state === 'legacy_unverified' && (
                  <p className="text-sm text-muted-foreground">This historical Exchange predates two-party confirmation. Earlier recorded feedback is preserved, but new feedback cannot be submitted without joint verification.</p>
                )}
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
