'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createMomentAction } from '@/application/actions/connectionActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

export function MomentScheduler({ surrogacyId }: { surrogacyId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [scheduledTime, setScheduledTime] = useState('')
  const [duration, setDuration] = useState(60)
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit() {
    if (!scheduledTime) {
      setError('Choose a date and time.')
      return
    }

    const parsed = new Date(scheduledTime)
    if (Number.isNaN(parsed.getTime())) {
      setError('Choose a valid date and time.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    const result = await createMomentAction({
      surrogacyId,
      scheduledTime: parsed.toISOString(),
      duration,
      location: location || undefined,
      notes: notes || undefined,
    })
    setIsSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    toast({ title: 'Moment scheduled', description: 'The Moment is now part of this relationship.' })
    setScheduledTime('')
    setLocation('')
    setNotes('')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader><CardTitle>Schedule a Moment</CardTitle><CardDescription>Create the next concrete interaction in this relationship.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><label className="text-sm font-medium">Date & time</label><Input type="datetime-local" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} /></div>
          <div className="space-y-2"><label className="text-sm font-medium">Duration (minutes)</label><Input type="number" min={15} max={1440} value={duration} onChange={(event) => setDuration(Number(event.target.value))} /></div>
          <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium">Location / method</label><Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Video call, coffee shop, address, etc." maxLength={300} /></div>
        </div>
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Shared notes or expectations" maxLength={2000} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button onClick={submit} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isSubmitting ? 'Scheduling...' : 'Schedule Moment'}</Button>
      </CardContent>
    </Card>
  )
}
