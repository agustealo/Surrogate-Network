'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import {
  acceptProposalAction,
  counterProposalAction,
  declineProposalAction,
  withdrawProposalAction,
} from '@/application/actions/marketplaceActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

type ProposalActionsProps = {
  proposalId: string
  status: 'pending' | 'countered'
  currentUserId: string
  proposingUserId: string
  receivingUserId: string
  counteredByUserId?: string
}

type ActionName = 'accept' | 'decline' | 'withdraw' | 'counter'
type ConfirmAction = Exclude<ActionName, 'counter'>

const confirmationCopy: Record<ConfirmAction, { title: string; description: string; label: string }> = {
  accept: {
    title: 'Accept this proposal?',
    description: 'Accepting creates an active Connection based on the recorded proposal terms. Review the Need, Offer, and terms before agreeing.',
    label: 'Confirm acceptance',
  },
  decline: {
    title: 'Decline this proposal?',
    description: 'Declining closes this proposal without creating a Connection.',
    label: 'Confirm decline',
  },
  withdraw: {
    title: 'Withdraw your proposal?',
    description: 'Withdrawing closes your proposal without creating a Connection.',
    label: 'Confirm withdrawal',
  },
}

export function ProposalActions({
  proposalId,
  status,
  currentUserId,
  proposingUserId,
  receivingUserId,
  counteredByUserId,
}: ProposalActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = useState<ActionName | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [counterOpen, setCounterOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [message, setMessage] = useState('')
  const [proposedDate, setProposedDate] = useState('')
  const [duration, setDuration] = useState('')
  const [frequency, setFrequency] = useState('')
  const [locationMethod, setLocationMethod] = useState('')

  const isProposer = currentUserId === proposingUserId
  const isRecipient = currentUserId === receivingUserId
  const mayRespond = status === 'pending'
    ? isRecipient
    : (isProposer || isRecipient) && counteredByUserId !== currentUserId

  async function run(action: ActionName) {
    if (busy !== null) return
    setBusy(action)
    setError(null)

    try {
      if (action === 'accept') {
        const result = await acceptProposalAction(proposalId)
        if (!result.ok) {
          setError(result.error)
          return
        }
        setConfirmAction(null)
      toast({ title: 'Proposal accepted', description: 'The relationship is now active.' })
        router.push(`/surrogacies/${result.data.surrogacyId}`)
        router.refresh()
        return
      }

      const result = action === 'decline'
        ? await declineProposalAction(proposalId)
        : action === 'withdraw'
          ? await withdrawProposalAction(proposalId)
          : await counterProposalAction({
              proposalId,
              message: message || undefined,
              proposedDate: proposedDate || undefined,
              duration: duration || undefined,
              frequency: frequency || undefined,
              locationMethod: locationMethod || undefined,
            })

      if (!result.ok) {
        setError(result.error)
        return
      }

      const title = action === 'counter'
        ? 'Proposal countered'
        : action === 'decline'
          ? 'Proposal declined'
          : 'Proposal withdrawn'
      toast({ title })
      setConfirmAction(null)
      setCounterOpen(false)
      router.refresh()
    } catch {
      setError('Your proposal action could not be completed. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {mayRespond && <Button size="sm" onClick={() => { setConfirmAction('accept'); setCounterOpen(false); setError(null) }} disabled={busy !== null}>{busy === 'accept' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Accept</Button>}
        {mayRespond && <Button size="sm" variant="outline" onClick={() => { setConfirmAction('decline'); setCounterOpen(false); setError(null) }} disabled={busy !== null}>{busy === 'decline' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Decline</Button>}
        {mayRespond && <Button size="sm" variant="secondary" onClick={() => { setCounterOpen((open) => !open); setConfirmAction(null); setError(null) }} disabled={busy !== null}>Counter</Button>}
        {isProposer && <Button size="sm" variant="ghost" onClick={() => { setConfirmAction('withdraw'); setCounterOpen(false); setError(null) }} disabled={busy !== null}>{busy === 'withdraw' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Withdraw</Button>}
      </div>

      {confirmAction && (
        <section aria-label="Review proposal decision" className="space-y-3 rounded-md border p-4">
          <h3 className="font-semibold">{confirmationCopy[confirmAction].title}</h3>
          <p className="text-sm text-muted-foreground">{confirmationCopy[confirmAction].description}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => run(confirmAction)} disabled={busy !== null}>
              {busy !== null && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmationCopy[confirmAction].label}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmAction(null)} disabled={busy !== null}>Keep reviewing</Button>
          </div>
        </section>
      )}

      {counterOpen && mayRespond && (
        <div className="space-y-3 rounded-md border p-4">
          <p className="text-sm text-muted-foreground">Propose different terms for the other member to review. A counter does not create a Connection; they must respond before you are connected.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={proposedDate} onChange={(event) => setProposedDate(event.target.value)} placeholder="Proposed date / window" maxLength={100} />
            <Input value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="Duration" maxLength={100} />
            <Input value={frequency} onChange={(event) => setFrequency(event.target.value)} placeholder="Frequency" maxLength={100} />
            <Input value={locationMethod} onChange={(event) => setLocationMethod(event.target.value)} placeholder="Location / method" maxLength={200} />
          </div>
          <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Explain the counter terms" maxLength={2000} />
          <Button size="sm" onClick={() => run('counter')} disabled={busy !== null}>{busy === 'counter' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send counter</Button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
