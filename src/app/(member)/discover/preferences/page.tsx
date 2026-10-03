import Link from 'next/link'
import { BookmarkCheck, EyeOff } from 'lucide-react'
import { RecommendationPreferenceService, type RecommendationPreferenceItem } from '@/application/services/RecommendationPreferenceService'
import { RecommendationPreferenceItemControls } from '@/components/recommendations/RecommendationPreferenceItemControls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { routes } from '@/lib/routes'

function PreferenceCard({
  item,
  mode,
}: {
  item: RecommendationPreferenceItem
  mode: 'saved' | 'hidden'
}) {
  const href = item.subjectType === 'need'
    ? routes.memberDynamic.need(item.subjectId)
    : routes.memberDynamic.offer(item.subjectId)
  const fallbackTitle = item.subjectType === 'need' ? 'Unavailable Need' : 'Unavailable Offer'

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{item.subjectType === 'need' ? 'Need' : 'Offer'}</Badge>
          {item.category && <Badge variant="secondary">{item.category}</Badge>}
          {!item.available && <Badge variant="secondary">Unavailable</Badge>}
        </div>
        <CardTitle>{item.title ?? fallbackTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {item.description ?? 'This recommendation is no longer available, but you can still clear its saved or hidden state.'}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {item.available && <Button asChild variant="outline" size="sm"><Link href={href}>View {item.subjectType === 'need' ? 'Need' : 'Offer'}</Link></Button>}
        <RecommendationPreferenceItemControls
          subjectType={item.subjectType}
          subjectId={item.subjectId}
          mode={mode}
        />
      </CardFooter>
    </Card>
  )
}

export default async function RecommendationPreferencesPage() {
  const view = await new RecommendationPreferenceService().getView()

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Recommendation preferences</h1>
          <p className="text-muted-foreground">Review what you saved and restore recommendations you previously hid.</p>
        </div>
        <Button asChild variant="outline"><Link href={routes.member.discover}>Back to Discover</Link></Button>
      </div>

      <section className="space-y-4" aria-labelledby="saved-recommendations">
        <h2 id="saved-recommendations" className="flex items-center gap-2 text-xl font-semibold">
          <BookmarkCheck className="h-5 w-5" aria-hidden="true" />
          Saved
        </h2>
        {view.saved.length > 0
          ? <div className="grid gap-4 md:grid-cols-2">{view.saved.map((item) => <PreferenceCard key={item.subjectType + ':' + item.subjectId} item={item} mode="saved" />)}</div>
          : <p className="text-muted-foreground">You have no saved recommendations.</p>}
      </section>

      <section className="space-y-4" aria-labelledby="hidden-recommendations">
        <h2 id="hidden-recommendations" className="flex items-center gap-2 text-xl font-semibold">
          <EyeOff className="h-5 w-5" aria-hidden="true" />
          Hidden
        </h2>
        {view.hidden.length > 0
          ? <div className="grid gap-4 md:grid-cols-2">{view.hidden.map((item) => <PreferenceCard key={item.subjectType + ':' + item.subjectId} item={item} mode="hidden" />)}</div>
          : <p className="text-muted-foreground">You have no hidden recommendations.</p>}
      </section>
    </div>
  )
}
