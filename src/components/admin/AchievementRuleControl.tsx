'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setAchievementRuleEnabledAction } from '@/application/actions/achievementActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export function AchievementRuleControl({
  code,
  enabled,
}: {
  code: string
  enabled: boolean
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()

  function updatePolicy() {
    setError(null)
    startTransition(async () => {
      const result = await setAchievementRuleEnabledAction({
        code,
        enabled: !enabled,
        reason,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast({
        title: enabled ? 'Achievement paused' : 'Achievement resumed',
        description: 'The change is saved in the network audit history.',
      })
      setReason('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-2 border-t pt-4">
      <Label htmlFor={'achievement-reason-' + code}>Reason for the change</Label>
      <Input
        id={'achievement-reason-' + code}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        minLength={8}
        maxLength={240}
        disabled={pending}
        placeholder="Required for the audit record"
      />
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <Button
        type="button"
        onClick={updatePolicy}
        disabled={pending || reason.trim().length < 8 || reason.trim().length > 240}
        variant={enabled ? 'destructive' : 'default'}
        aria-label={(enabled ? 'Pause ' : 'Resume ') + code + ' achievement awards'}
      >
        {pending ? 'Updating…' : enabled ? 'Pause new awards' : 'Resume new awards'}
      </Button>
    </div>
  )
}
