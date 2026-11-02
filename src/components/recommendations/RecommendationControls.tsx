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
    const byKey = new Map(items.map((item) => [`${item.subjectType}:${item.subjectId}`, item]))
    const seen = new Set<string>()
    const pending = new Map<string, RecommendationImpressionItem>()
    let flushTimer: ReturnType<typeof setTimeout> | undefined

    function flush() {
      flushTimer = undefined
      if (!pending.size) return
      const batch = [...pending.values()]
      pending.clear()
      // Server-side session deduplication remains authoritative.
      void recordRecommendationImpressionsAction({ sessionId, items: batch })
    }

    if (typeof IntersectionObserver === 'undefined') {
      // Do not fabricate impressions in browsers without visibility observation.
      return
    }

    const observer = new IntersectionObserver((entries) => {
      if (document.visibilityState === 'hidden') return
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) continue
        const key = (entry.target as HTMLElement).dataset.recommendationKey
        if (!key || seen.has(key)) continue
        const item = byKey.get(key)
        if (!item) continue
        seen.add(key)
        pending.set(key, item)
        observer.unobserve(entry.target)
      }
      if (pending.size && !flushTimer) flushTimer = setTimeout(flush, 150)
    }, { threshold: 0.5 })

    for (const element of document.querySelectorAll<HTMLElement>('[data-recommendation-key]')) {
      if (byKey.has(element.dataset.recommendationKey ?? '')) observer.observe(element)
    }

    return () => {
      observer.disconnect()
      if (flushTimer) clearTimeout(flushTimer)
      flush()
    }
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
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    setIsSaved(saved)
  }, [saved])

  async function toggleSave() {
    if (!hydrated || busy) return
    setBusy('save')
    const nextSaved = !isSaved
    try {
      const result = await setRecommendationPreferenceAction({
        subjectType,
        subjectId,
        preference: nextSaved ? 'save' : 'unsave',
      })
      if (!result.ok) {
        toast({ title: 'Could not update saved state', description: result.error, variant: 'destructive' })
        return
      }
      setIsSaved(nextSaved)
      toast({ title: nextSaved ? 'Saved for later' : 'Removed from saved' })
    } catch {
      toast({ title: 'Could not update saved state', description: 'Please try again.', variant: 'destructive' })
    } finally {
      setBusy(null)
    }
  }

  async function hideRecommendation() {
    if (!hydrated || busy) return
    setBusy('not_interested')
    try {
      const result = await setRecommendationPreferenceAction({
        subjectType,
        subjectId,
        preference: 'not_interested',
      })
      if (!result.ok) {
        toast({ title: 'Could not update recommendation', description: result.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Recommendation hidden', description: 'You can restore it from Saved & hidden.' })
      router.refresh()
    } catch {
      toast({ title: 'Could not update recommendation', description: 'Please try again.', variant: 'destructive' })
    } finally {
      setBusy(null)
    }
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
      <Button type="button" variant="ghost" size="sm" onClick={toggleSave} disabled={!hydrated || busy !== null} aria-pressed={isSaved}>
        {busy === 'save' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isSaved ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
        {isSaved ? 'Saved' : 'Save'}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={hideRecommendation} disabled={!hydrated || busy !== null}>
        {busy === 'not_interested' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsDown className="mr-2 h-4 w-4" />}
        Hide from Discover
      </Button>
    </div>
  )
}
