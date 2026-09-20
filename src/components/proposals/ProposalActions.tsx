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
    setBusy(action)
    setError(null)

    if (action === 'accept') {
      const result = await acceptProposalAction(proposalId)
      setBusy(null)
      if (!result.ok) {
        setError(result.error)
        return
      }
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

    setBusy(null)
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
    setCounterOpen(false)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {mayRespond && <Button size="sm" onClick={() => run('accept')} disabled={busy !== null}>{busy === 'accept' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Accept</Button>}
        {mayRespond && <Button size="sm" variant="outline" onClick={() => run('decline')} disabled={busy !== null}>{busy === 'decline' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Decline</Button>}
        {mayRespond && <Button size="sm" variant="secondary" onClick={() => setCounterOpen((open) => !open)} disabled={busy !== null}>Counter</Button>}
        {isProposer && <Button size="sm" variant="ghost" onClick={() => run('withdraw')} disabled={busy !== null}>{busy === 'withdraw' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Withdraw</Button>}
      </div>

      {counterOpen && mayRespond && (
        <div className="space-y-3 rounded-md border p-4">
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
