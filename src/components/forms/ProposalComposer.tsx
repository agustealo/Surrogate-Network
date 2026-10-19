'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createProposalAction } from '@/application/actions/marketplaceActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

type PairOption = {
  id: string
  title: string
}

type ProposalComposerProps =
  | { needId: string; offerId?: never; options: PairOption[] }
  | { needId?: never; offerId: string; options: PairOption[] }

export function ProposalComposer(props: ProposalComposerProps) {
  const formId = useId()
  const router = useRouter()
  const { toast } = useToast()
  const [selectedId, setSelectedId] = useState('')
  const [message, setMessage] = useState('')
  const [proposedDate, setProposedDate] = useState('')
  const [duration, setDuration] = useState('')
  const [frequency, setFrequency] = useState('')
  const [locationMethod, setLocationMethod] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pairingLabel = 'needId' in props ? 'your Offer' : 'your Need'
  const createHref = 'needId' in props ? '/offers/create' : '/needs/create'

  async function submit() {
    if (!selectedId) {
      setError(`Select ${pairingLabel} first.`)
      return
    }

    setIsSubmitting(true)
    setError(null)
    let result: Awaited<ReturnType<typeof createProposalAction>>
    try {
      result = await createProposalAction({
      needId: 'needId' in props ? props.needId : selectedId,
      offerId: 'offerId' in props ? props.offerId : selectedId,
      message: message || undefined,
      proposedDate: proposedDate || undefined,
      duration: duration || undefined,
      frequency: frequency || undefined,
      locationMethod: locationMethod || undefined,
      })
    } catch {
      setError('Your proposal could not be sent. Please try again.')
      setIsSubmitting(false)
      return
    }
    setIsSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    toast({ title: 'Proposal sent', description: 'The other member can now respond from Proposals.' })
    router.push('/proposals')
    router.refresh()
  }

  if (!props.options.length) {
    return (
      <Card>
        <CardHeader><CardTitle>Make a proposal</CardTitle><CardDescription>You need an active {pairingLabel} to create this pairing.</CardDescription></CardHeader>
        <CardContent><Button asChild><Link href={createHref}>Create {pairingLabel}</Link></Button></CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Make a proposal</CardTitle>
        <CardDescription>Pair this listing with {pairingLabel}. The other member must accept before you become connected.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor={`${formId}-pair`} className="text-sm font-medium">Pair with {pairingLabel}</label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger id={`${formId}-pair`} aria-invalid={Boolean(error && !selectedId)}><SelectValue placeholder={`Select ${pairingLabel}`} /></SelectTrigger>
            <SelectContent>{props.options.map((option) => <SelectItem key={option.id} value={option.id}>{option.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={`${formId}-date`} className="text-sm font-medium">Proposed date or window (optional)</label>
            <Input id={`${formId}-date`} value={proposedDate} onChange={(event) => setProposedDate(event.target.value)} placeholder="For example, next weekend" maxLength={100} />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${formId}-duration`} className="text-sm font-medium">Duration (optional)</label>
            <Input id={`${formId}-duration`} value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="For example, one hour" maxLength={100} />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${formId}-frequency`} className="text-sm font-medium">Frequency (optional)</label>
            <Input id={`${formId}-frequency`} value={frequency} onChange={(event) => setFrequency(event.target.value)} placeholder="For example, once a week" maxLength={100} />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${formId}-location`} className="text-sm font-medium">Location or meeting method (optional)</label>
            <Input id={`${formId}-location`} value={locationMethod} onChange={(event) => setLocationMethod(event.target.value)} placeholder="For example, online" maxLength={200} />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor={`${formId}-message`} className="text-sm font-medium">Message (optional)</label>
          <Textarea id={`${formId}-message`} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Share details that will help the other member decide" maxLength={2000} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button onClick={submit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Sending...' : 'Send proposal'}
        </Button>
      </CardContent>
    </Card>
  )
}
