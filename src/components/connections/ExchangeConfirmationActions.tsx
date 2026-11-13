'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck, Flag, Loader2 } from 'lucide-react'
import { confirmExchangeAction } from '@/application/actions/connectionActions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function ExchangeConfirmationActions({
  exchangeId,
  surrogacyId,
  reportedStatus,
}: {
  exchangeId: string
  surrogacyId: string
  reportedStatus: 'completed' | 'partial'
}) {
  const router = useRouter()
  const guidanceId = useId()
  const { toast } = useToast()
  const [pending, setPending] = useState<'confirm' | 'dispute' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function decide(decision: 'confirm' | 'dispute') {
    if (pending !== null) return
    setError(null)
    setPending(decision)
    try {
      const result = await confirmExchangeAction({ exchangeId, surrogacyId, decision })
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast({
        title: result.data.state === 'confirmed' ? 'Exchange confirmed' : 'Exchange disputed',
        description: result.data.state === 'confirmed'
          ? 'Both participants have now acknowledged this outcome. Feedback is available.'
          : 'This outcome is disputed. Feedback and new rewards are unavailable for this Exchange.',
      })
      router.refresh()
    } catch {
      setError('The decision could not be saved. Check your connection and try again.')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-3 rounded-md border p-4" aria-label="Exchange confirmation">
      <p className="text-sm font-semibold">Your confirmation is required</p>
      <p id={guidanceId} className="text-sm text-muted-foreground">
        The other participant reported this Exchange as {reportedStatus}.
        Confirm only if that matches what happened. Confirmation makes verified
        feedback available. Disputing locks the reported outcome and prevents
        feedback and new rewards for this Exchange. Choose carefully: the
        decision cannot be changed through these controls.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => decide('confirm')}
          aria-describedby={guidanceId}
          disabled={pending !== null}
        >
          {pending === 'confirm' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCheck className="mr-2 h-4 w-4" aria-hidden="true" />}
          Confirm outcome
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => decide('dispute')}
          aria-describedby={guidanceId}
          disabled={pending !== null}
        >
          {pending === 'dispute' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Flag className="mr-2 h-4 w-4" aria-hidden="true" />}
          Dispute outcome
        </Button>
      </div>
      {pending && <p role="status" className="text-sm text-muted-foreground">Saving your Exchange decision…</p>}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  )
}
