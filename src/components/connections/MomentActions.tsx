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
    if (busy !== null) return
    setBusy(status === 'completed' ? 'complete' : status)
    setError(null)
    try {
      const result = await completeMomentAction(momentId, surrogacyId, status)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast({ title: 'Exchange recorded', description: `This Moment is recorded as ${status}.` })
      router.refresh()
    } catch {
      setError('The Moment could not be updated. Please check your connection and try again.')
    } finally {
      setBusy(null)
    }
  }

  async function cancel() {
    if (busy !== null) return
    setBusy('cancel')
    setError(null)
    try {
      const result = await cancelMomentAction(momentId, surrogacyId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast({ title: 'Moment cancelled' })
      router.refresh()
    } catch {
      setError('The Moment could not be cancelled. Please check your connection and try again.')
    } finally {
      setBusy(null)
    }
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
