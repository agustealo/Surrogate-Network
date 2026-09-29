'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bookmark, BookmarkCheck, Loader2, ThumbsDown } from 'lucide-react'
import {
  recordRecommendationImpressionsAction,
  recordRecommendationOpenAction,
  setRecommendationPreferenceAction,
} from '@/application/actions/recommendationActions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export type RecommendationImpressionItem = {
  subjectType: 'need' | 'offer'
  subjectId: string
  rankingVersion: string
  rankPosition: number
  score: number
}

export function RecommendationImpressionTracker({
  sessionId,
  items,
}: {
  sessionId: string
  items: RecommendationImpressionItem[]
}) {
  useEffect(() => {
    void recordRecommendationImpressionsAction({ sessionId, items })
  }, [sessionId, items])

  return null
}

export function RecommendationControls({
  subjectType,
  subjectId,
  href,
  saved,
  sessionId,
  rankingVersion,
  rankPosition,
  score,
}: {
  subjectType: 'need' | 'offer'
  subjectId: string
  href: string
  saved: boolean
  sessionId: string
  rankingVersion: string
  rankPosition: number
  score: number
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSaved, setIsSaved] = useState(saved)
  const [busy, setBusy] = useState<'save' | 'not_interested' | null>(null)

  async function toggleSave() {
    setBusy('save')
    const nextSaved = !isSaved
    const result = await setRecommendationPreferenceAction({
      subjectType,
      subjectId,
      preference: nextSaved ? 'save' : 'unsave',
    })
    setBusy(null)
    if (!result.ok) {
      toast({ title: 'Could not update saved state', description: result.error, variant: 'destructive' })
      return
    }
    setIsSaved(nextSaved)
    toast({ title: nextSaved ? 'Saved for later' : 'Removed from saved' })
  }

  async function hideRecommendation() {
    setBusy('not_interested')
    const result = await setRecommendationPreferenceAction({
      subjectType,
      subjectId,
      preference: 'not_interested',
    })
    setBusy(null)
    if (!result.ok) {
      toast({ title: 'Could not update recommendation', description: result.error, variant: 'destructive' })
      return
    }
    router.refresh()
  }

  function recordOpen() {
    void recordRecommendationOpenAction({
      subjectType,
      subjectId,
      sessionId,
      rankingVersion,
      rankPosition,
      score,
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline">
        <Link href={href} onClick={recordOpen}>View {subjectType === 'need' ? 'Need' : 'Offer'}</Link>
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={toggleSave} disabled={busy !== null} aria-pressed={isSaved}>
        {busy === 'save' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isSaved ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
        {isSaved ? 'Saved' : 'Save'}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={hideRecommendation} disabled={busy !== null}>
        {busy === 'not_interested' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsDown className="mr-2 h-4 w-4" />}
        Not interested
      </Button>
    </div>
  )
}
