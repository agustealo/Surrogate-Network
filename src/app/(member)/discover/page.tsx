import Link from 'next/link'
import { Handshake, Heart, Sparkles } from 'lucide-react'
import { FypRecommendationService } from '@/application/services/FypRecommendationService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  RecommendationControls,
  RecommendationImpressionTracker,
  type RecommendationImpressionItem,
} from '@/components/recommendations/RecommendationControls'
import { routes } from '@/lib/routes'

function RecommendationSignals({ score, reasons }: { score: number; reasons: { code: string; label: string }[] }) {
  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <span>{score}% fit for you</span>
      </div>
      {reasons.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Why this recommendation">
          {reasons.map((reason) => (
            <Badge key={reason.code} variant="secondary">{reason.label}</Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function cursorValue(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0
}

function discoverHref(sessionId: string, needOffset: number, offerOffset: number) {
  const params = new URLSearchParams({ sessionId })
  if (needOffset > 0) params.set('needOffset', String(needOffset))
  if (offerOffset > 0) params.set('offerOffset', String(offerOffset))
  const query = params.toString()
  return query ? `/discover?${query}` : '/discover'
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string | string[]; needOffset?: string | string[]; offerOffset?: string | string[] }>
}) {
  const params = await searchParams
  const requestedSessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId
  const feed = await new FypRecommendationService().getFeed(new Date(), {
    sessionId: requestedSessionId,
    needOffset: cursorValue(params.needOffset),
    offerOffset: cursorValue(params.offerOffset),
  })
  const impressionItems: RecommendationImpressionItem[] = [
    ...feed.needs.map((need) => ({
      subjectType: 'need' as const,
      subjectId: need.id,
      rankingVersion: need.recommendation.rankingVersion,
      rankPosition: need.rankPosition,
      score: need.recommendation.score,
    })),
    ...feed.offers.map((offer) => ({
      subjectType: 'offer' as const,
      subjectId: offer.id,
      rankingVersion: offer.recommendation.rankingVersion,
      rankPosition: offer.rankPosition,
      score: offer.recommendation.score,
    })),
  ]

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
      <RecommendationImpressionTracker sessionId={feed.sessionId} items={impressionItems} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Discover</h1>
          <p className="text-muted-foreground">For You recommendations ranked from your explicit profile and marketplace intent.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href={routes.member.recommendationPreferences}>Saved & hidden</Link></Button>
          <Button asChild variant="outline"><Link href="/needs/create">Create Need</Link></Button>
          <Button asChild><Link href="/offers/create">Create Offer</Link></Button>
        </div>
      </div>

      {(feed.ownNeedIds.length > 0 || feed.ownOfferIds.length > 0) && (
        <section className="space-y-3" aria-labelledby="your-active-listings">
          <h2 id="your-active-listings" className="text-lg font-semibold">Your active listings</h2>
          <div className="flex flex-wrap gap-2">
            {feed.ownNeedIds.map((id) => <Button key={id} asChild size="sm" variant="outline"><Link href={routes.memberDynamic.need(id)}>View Need</Link></Button>)}
            {feed.ownOfferIds.map((id) => <Button key={id} asChild size="sm" variant="outline"><Link href={routes.memberDynamic.offer(id)}>View Offer</Link></Button>)}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Heart className="h-5 w-5" />Recommended Needs</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {feed.needs.map((need) => (
            <Card key={need.id}>
              <CardHeader>
                <Badge className="w-fit" variant="outline">{need.category}</Badge>
                <CardTitle>{need.title}</CardTitle>
                <CardDescription>Requested by <Link className="underline" href={routes.memberDynamic.profile(need.user_id)}>{need.user_name}</Link></CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-4">{need.description}</p>
                <RecommendationSignals score={need.recommendation.score} reasons={need.recommendation.reasons} />
              </CardContent>
              <CardFooter>
                <RecommendationControls
                  subjectType="need"
                  subjectId={need.id}
                  href={routes.memberDynamic.need(need.id)}
                  saved={need.saved}
                  sessionId={feed.sessionId}
                  rankingVersion={need.recommendation.rankingVersion}
                  rankPosition={need.rankPosition}
                  score={need.recommendation.score}
                />
              </CardFooter>
            </Card>
          ))}
        </div>
        {!feed.needs.length && <p className="text-muted-foreground">No eligible active Needs are currently available on this page.</p>}
        <div className="flex items-center justify-between gap-3">
          <div>{feed.needOffset > 0 && <Button asChild variant="outline"><Link href={discoverHref(feed.sessionId, 0, feed.offerOffset)}>First Needs</Link></Button>}</div>
          {feed.nextNeedOffset !== null && <Button asChild variant="outline"><Link href={discoverHref(feed.sessionId, feed.nextNeedOffset, feed.offerOffset)}>More Needs</Link></Button>}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Handshake className="h-5 w-5" />Recommended Offers</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {feed.offers.map((offer) => (
            <Card key={offer.id}>
              <CardHeader>
                <Badge className="w-fit" variant="outline">{offer.category}</Badge>
                <CardTitle>{offer.title}</CardTitle>
                <CardDescription>Offered by <Link className="underline" href={routes.memberDynamic.profile(offer.user_id)}>{offer.user_name}</Link></CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-4">{offer.description}</p>
                {typeof offer.rating === 'number' && <p className="mt-3 text-sm text-muted-foreground">{offer.rating.toFixed(1)} rating · {offer.review_count ?? 0} reviews</p>}
                <RecommendationSignals score={offer.recommendation.score} reasons={offer.recommendation.reasons} />
              </CardContent>
              <CardFooter>
                <RecommendationControls
                  subjectType="offer"
                  subjectId={offer.id}
                  href={routes.memberDynamic.offer(offer.id)}
                  saved={offer.saved}
                  sessionId={feed.sessionId}
                  rankingVersion={offer.recommendation.rankingVersion}
                  rankPosition={offer.rankPosition}
                  score={offer.recommendation.score}
                />
              </CardFooter>
            </Card>
          ))}
        </div>
        {!feed.offers.length && <p className="text-muted-foreground">No eligible active Offers are currently available on this page.</p>}
        <div className="flex items-center justify-between gap-3">
          <div>{feed.offerOffset > 0 && <Button asChild variant="outline"><Link href={discoverHref(feed.sessionId, feed.needOffset, 0)}>First Offers</Link></Button>}</div>
          {feed.nextOfferOffset !== null && <Button asChild variant="outline"><Link href={discoverHref(feed.sessionId, feed.needOffset, feed.nextOfferOffset)}>More Offers</Link></Button>}
        </div>
      </section>
    </div>
  )
}
