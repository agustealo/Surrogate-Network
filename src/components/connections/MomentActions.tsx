'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { cancelMomentAction, completeMomentAction } from '@/application/actions/connectionActions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function MomentActions({ momentId, surrogacyId }: { momentId: string; surrogacyId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = useState<'complete' | 'partial' | 'disputed' | 'cancel' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function complete(status: 'completed' | 'partial' | 'disputed') {
    setBusy(status === 'completed' ? 'complete' : status)
    setError(null)
    const result = await completeMomentAction(momentId, surrogacyId, status)
    setBusy(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    toast({ title: 'Exchange recorded', description: `This Moment is recorded as ${status}.` })
    router.refresh()
  }

  async function cancel() {
    setBusy('cancel')
    setError(null)
    const result = await cancelMomentAction(momentId, surrogacyId)
    setBusy(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    toast({ title: 'Moment cancelled' })
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => complete('completed')} disabled={busy !== null}>{busy === 'complete' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Complete</Button>
        <Button size="sm" variant="outline" onClick={() => complete('partial')} disabled={busy !== null}>Partial</Button>
        <Button size="sm" variant="destructive" onClick={() => complete('disputed')} disabled={busy !== null}>Disputed</Button>
        <Button size="sm" variant="ghost" onClick={cancel} disabled={busy !== null}>{busy === 'cancel' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Cancel</Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
