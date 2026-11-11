'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  requestRewardReviewAction,
  adjudicateRewardReviewAction,
  submitRewardReviewAppealAction,
  reviewRewardReviewAppealAction,
} from '@/application/actions/achievementActions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

type ReviewAction = 'request' | 'adjudicate' | 'appeal' | 'reviewAppeal'

type Option = {
  decision?: 'invalidate' | 'dismiss' | 'accept' | 'deny'
  label: string
}

const reviewOptions: Record<ReviewAction, Option[]> = {
  request: [{ label: 'Submit evidence review request' }],
  adjudicate: [
    { decision: 'invalidate', label: 'Invalidate credited reward' },
    { decision: 'dismiss', label: 'Dismiss review or restore credit' },
  ],
  appeal: [{ label: 'Request independent appeal' }],
  reviewAppeal: [
    { decision: 'accept', label: 'Accept appeal and reopen' },
    { decision: 'deny', label: 'Deny appeal' },
  ],
}

export function RewardReviewRequestForm({ feedbackId }: { feedbackId: string }) {
  return (
    <RewardReviewControls
      kind="request"
      id={feedbackId}
      heading="Question this Feedback's reward eligibility"
      description="Only an Exchange counterpart can request review of credited Feedback.
        Describe the evidence, not just the star rating. A review is not a finding
        of dishonesty and does not automatically remove XP."
    />
  )
}

export function RewardReviewAppealForm({ reportId }: { reportId: string }) {
  return (
    <RewardReviewControls
      kind="appeal"
      id={reportId}
      heading="Appeal this reward decision"
      description="An affected participant may appeal once within 30 days.
        An independent administrator must review new evidence before the
        original decision can be reconsidered."
    />
  )
}

export function RewardReviewDecisionControls({ reportId }: { reportId: string }) {
  return (
    <RewardReviewControls
      kind="adjudicate"
      id={reportId}
      heading="Evidence-based reward determination"
      description="Invalidate only when the linked reward evidence warrants it.
        This writes a new negative XP journal entry, never deletes the original.
        Dismissing an appeal-reopened case restores a prior reversal exactly once."
    />
  )
}

export function RewardAppealDecisionControls({ appealId }: { appealId: string }) {
  return (
    <RewardReviewControls
      kind="reviewAppeal"
      id={appealId}
      heading="Independent reward appeal review"
      description="The reviewer must differ from the original case adjudicator.
        Accepting reopens the case; it does not itself restore XP or badges."
    />
  )
}

function RewardReviewControls({
  kind,
  id,
  heading,
  description,
}: {
  kind: ReviewAction
  id: string
  heading: string
  description: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(decision?: Option['decision']) {
    setError(null)
    startTransition(async () => {
      const result = kind === 'request'
        ? await requestRewardReviewAction({ feedbackId: id, reason })
        : kind === 'adjudicate'
          ? await adjudicateRewardReviewAction({ reportId: id, decision, reason })
          : kind === 'appeal'
            ? await submitRewardReviewAppealAction({ reportId: id, reason })
            : await reviewRewardReviewAppealAction({ appealId: id, decision, reason })

      if (!result.ok) {
        setError(result.error)
        return
      }
      toast({
        title: 'Review action recorded',
        description: 'The case and its supporting evidence are available in the review history.',
      })
      setReason('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <h3 className="font-semibold">{heading}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Label htmlFor={'reward-review-' + kind + '-' + id}>Evidence and reasoning</Label>
      <Textarea
        id={'reward-review-' + kind + '-' + id}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        minLength={20}
        maxLength={2000}
        disabled={pending}
        placeholder="Describe supporting facts or evidence (20 to 2000 characters)"
      />
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {reviewOptions[kind].map((option) => (
          <Button
            key={option.label}
            type="button"
            size="sm"
            variant={option.decision === 'invalidate' || option.decision === 'deny'
              ? 'outline' : 'default'}
            disabled={pending || reason.trim().length < 20 || reason.trim().length > 2000}
            onClick={() => submit(option.decision)}
          >
            {pending ? 'Recording…' : option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
