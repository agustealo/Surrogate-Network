'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RotateCcw, Trash2 } from 'lucide-react'
import { setRecommendationPreferenceAction } from '@/application/actions/recommendationActions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function RecommendationPreferenceItemControls({
  subjectType,
  subjectId,
  mode,
}: {
  subjectType: 'need' | 'offer'
  subjectId: string
  mode: 'saved' | 'hidden'
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)

  async function updatePreference() {
    setBusy(true)
    const result = await setRecommendationPreferenceAction({
      subjectType,
      subjectId,
      preference: mode === 'saved' ? 'unsave' : 'restore_interest',
    })
    setBusy(false)

    if (!result.ok) {
      toast({
        title: mode === 'saved' ? 'Could not remove saved recommendation' : 'Could not restore recommendation',
        description: result.error,
        variant: 'destructive',
      })
      return
    }

    toast({ title: mode === 'saved' ? 'Removed from saved' : 'Recommendation restored' })
    router.refresh()
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={updatePreference} disabled={busy}>
      {busy
        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        : mode === 'saved'
          ? <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
          : <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />}
      {mode === 'saved' ? 'Remove saved' : 'Show again'}
    </Button>
  )
}
