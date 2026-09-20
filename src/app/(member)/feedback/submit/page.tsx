import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FeedbackForm } from '@/components/forms/FeedbackForm'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { createClient } from '@/infrastructure/supabase/server'
import { routes } from '@/lib/routes'

export const metadata: Metadata = {
  title: 'Submit Feedback - Surrogate Network',
  description: 'Review a completed Exchange with another Surrogate Network member.',
}

type SubmitFeedbackPageProps = {
  searchParams: Promise<{ exchange?: string }>
}

export default async function SubmitFeedbackPage({ searchParams }: SubmitFeedbackPageProps) {
  const { exchange: exchangeId } = await searchParams
  if (!exchangeId) {
    return (
      <PageWrapper title="Submit Feedback" className="mx-auto max-w-xl">
        <p className="mb-4 text-muted-foreground">Feedback starts from a completed Exchange so the review is tied to a real interaction.</p>
        <Button asChild><Link href="/surrogacies">Open Connections</Link></Button>
      </PageWrapper>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(routes.public.login)

  const { data: exchange, error: exchangeError } = await supabase
    .from('exchanges')
    .select('id,surrogacy_id,status')
    .eq('id', exchangeId)
    .maybeSingle()
  if (exchangeError || !exchange || !['completed', 'partial'].includes(exchange.status)) {
    return <PageWrapper title="Feedback unavailable" className="mx-auto max-w-xl"><p className="text-muted-foreground">That Exchange is not available for feedback.</p></PageWrapper>
  }

  const { data: relationship, error: relationshipError } = await supabase
    .from('surrogacies')
    .select('id,need_id,offer_id,partner_ids')
    .eq('id', exchange.surrogacy_id)
    .single()
  if (relationshipError || !relationship) throw new Error('Unable to resolve the Exchange relationship.')

  const otherUserId = relationship.partner_ids.find((partnerId) => partnerId !== user.id)
  if (!otherUserId) throw new Error('Relationship participant data is incomplete.')

  const [{ data: need }, { data: offer }] = await Promise.all([
    supabase.from('needs').select('user_id,user_name').eq('id', relationship.need_id).single(),
    supabase.from('offers').select('user_id,user_name').eq('id', relationship.offer_id).single(),
  ])
  const companionName = need?.user_id === otherUserId ? need.user_name : offer?.user_name ?? 'your connection'

  return (
    <PageWrapper title="Submit Feedback" className="mx-auto max-w-xl">
      <FeedbackForm exchangeId={exchange.id} toUserId={otherUserId} companionName={companionName} />
    </PageWrapper>
  )
}
