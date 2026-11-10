'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitExchangeCaseAppealAction } from '@/application/actions/moderationActions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

export function ExchangeCaseAppealForm({ reportId }: { reportId: string }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await submitExchangeCaseAppealAction({ reportId, reason })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setReason('')
      toast({
        title: 'Appeal submitted',
        description: 'An independent administrator can now review your request.',
      })
      router.refresh()
    })
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <h3 className="font-semibold">Request an independent review</h3>
      <p className="text-sm text-muted-foreground">
        You may appeal this case decision once within 30 days. State which
        evidence or circumstances require reconsideration. An appeal does not
        automatically reverse the outcome or grant XP.
      </p>
      <Label htmlFor={'exchange-appeal-' + reportId}>Reason for appeal</Label>
      <Textarea
        id={'exchange-appeal-' + reportId}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        minLength={12}
        maxLength={2000}
        disabled={pending}
        placeholder="Describe the evidence or decision you want reviewed"
      />
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <Button
        onClick={submit}
        type="button"
        disabled={pending || reason.trim().length < 12 || reason.trim().length > 2000}
      >
        {pending ? 'Submitting appeal…' : 'Submit appeal'}
      </Button>
    </div>
  )
}
