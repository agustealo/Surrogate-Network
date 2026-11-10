'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  adjudicateExchangeCaseAction,
  reviewExchangeCaseAppealAction,
} from '@/application/actions/moderationActions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

type CaseDecision = 'uphold' | 'dismiss'
type AppealDecision = 'accept' | 'deny'

export function ExchangeCaseDecisionControls({ reportId }: { reportId: string }) {
  return <ReasonedDecisionControls
    recordId={reportId}
    kind="case"
    label="Independent Exchange case determination"
    options={[
      { decision: 'uphold', label: 'Uphold the dispute' },
      { decision: 'dismiss', label: 'Dismiss the case' },
    ]}
  />
}

export function ExchangeCaseAppealReviewControls({ appealId }: { appealId: string }) {
  return <ReasonedDecisionControls
    recordId={appealId}
    kind="appeal"
    label="Independent appeal review"
    options={[
      { decision: 'accept', label: 'Accept and reopen case' },
      { decision: 'deny', label: 'Deny appeal' },
    ]}
  />
}

function ReasonedDecisionControls({
  recordId,
  kind,
  label,
  options,
}: {
  recordId: string
  kind: 'case' | 'appeal'
  label: string
  options: Array<{ decision: CaseDecision | AppealDecision; label: string }>
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function decide(decision: CaseDecision | AppealDecision) {
    setError(null)
    startTransition(async () => {
      const result = kind === 'case'
        ? await adjudicateExchangeCaseAction({
          reportId: recordId,
          decision,
          reason,
        })
        : await reviewExchangeCaseAppealAction({
          appealId: recordId,
          decision,
          reason,
        })
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast({
        title: kind === 'case' ? 'Case decision recorded' : 'Appeal reviewed',
        description: 'The decision and justification were added to the audit record.',
      })
      setReason('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-3 rounded-md border p-4" aria-label={label}>
      <Label htmlFor={'case-reason-' + recordId}>{label} rationale</Label>
      <Textarea
        id={'case-reason-' + recordId}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        minLength={12}
        maxLength={2000}
        disabled={pending}
        placeholder="Document the evidence and reasoning (12 to 2000 characters)"
      />
      <p className="text-xs text-muted-foreground">
        These decisions do not confirm the Exchange, change XP, or assign guilt.
        A different administrator must review an appeal.
      </p>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.decision}
            type="button"
            size="sm"
            variant={option.decision === 'uphold' || option.decision === 'deny' ? 'outline' : 'default'}
            disabled={pending || reason.trim().length < 12 || reason.trim().length > 2000}
            onClick={() => decide(option.decision)}
          >
            {pending ? 'Recording decision…' : option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
