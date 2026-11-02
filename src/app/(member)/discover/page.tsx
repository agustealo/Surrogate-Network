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

function RecommendationSignals({ reasons }: { reasons: { code: string; label: string }[] }) {
  return (
    <div className="mt-4 space-y-2" aria-label="Recommendation explanation">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <span>Why you may be seeing this</span>
      </div>
      {reasons.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Ranking signals">
          {reasons.map((reason) => (
            <li key={reason.code}><Badge variant="secondary">{reason.label}</Badge></li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No specific matching signal is available for this recommendation.</p>
      )}
      <p className="text-xs text-muted-foreground">
        These are automated ranking signals, not verified compatibility, safety checks, or a promise of availability.
        Review the listing and agree on boundaries before connecting.
      </p>
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
          <p className="text-muted-foreground">Explore Needs and Offers ranked using available listing and profile signals. A recommendation is an invitation to look closer, not an agreement.</p>
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
            <Card key={need.id} data-recommendation-key={`need:${need.id}`}>
              <CardHeader>
                <Badge className="w-fit" variant="outline">{need.category}</Badge>
                <CardTitle>{need.title}</CardTitle>
                <CardDescription>Requested by <Link className="underline" href={routes.memberDynamic.profile(need.user_id)}>{need.user_name}</Link></CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-4">{need.description}</p>
                <RecommendationSignals reasons={need.recommendation.reasons} />
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
        {!feed.needs.length && (
          <div className="space-y-3 rounded-lg border border-dashed p-5" role="status">
            <p className="font-medium">No matching Needs here yet</p>
            <p className="text-sm text-muted-foreground">You can explore Offers, share what you're looking for, or revisit your saved and hidden recommendations.</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm"><Link href={routes.member.needsCreate}>Share a Need</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href={routes.member.recommendationPreferences}>Saved & hidden</Link></Button>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <div>{feed.needOffset > 0 && <Button asChild variant="outline"><Link href={discoverHref(feed.sessionId, 0, feed.offerOffset)}>First Needs</Link></Button>}</div>
          {feed.nextNeedOffset !== null && <Button asChild variant="outline"><Link href={discoverHref(feed.sessionId, feed.nextNeedOffset, feed.offerOffset)}>More Needs</Link></Button>}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Handshake className="h-5 w-5" />Recommended Offers</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {feed.offers.map((offer) => (
            <Card key={offer.id} data-recommendation-key={`offer:${offer.id}`}>
              <CardHeader>
                <Badge className="w-fit" variant="outline">{offer.category}</Badge>
                <CardTitle>{offer.title}</CardTitle>
                <CardDescription>Offered by <Link className="underline" href={routes.memberDynamic.profile(offer.user_id)}>{offer.user_name}</Link></CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-4">{offer.description}</p>
                {typeof offer.rating === 'number' && <p className="mt-3 text-sm text-muted-foreground">{offer.rating.toFixed(1)} rating · {offer.review_count ?? 0} reviews</p>}
                <RecommendationSignals reasons={offer.recommendation.reasons} />
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
        {!feed.offers.length && (
          <div className="space-y-3 rounded-lg border border-dashed p-5" role="status">
            <p className="font-medium">No matching Offers here yet</p>
            <p className="text-sm text-muted-foreground">New offers may appear later. You can share what you need or review recommendations you've saved.</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm"><Link href={routes.member.needsCreate}>Share a Need</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href={routes.member.recommendationPreferences}>Saved & hidden</Link></Button>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <div>{feed.offerOffset > 0 && <Button asChild variant="outline"><Link href={discoverHref(feed.sessionId, feed.needOffset, 0)}>First Offers</Link></Button>}</div>
          {feed.nextOfferOffset !== null && <Button asChild variant="outline"><Link href={discoverHref(feed.sessionId, feed.needOffset, feed.nextOfferOffset)}>More Offers</Link></Button>}
        </div>
      </section>
    </div>
  )
}
