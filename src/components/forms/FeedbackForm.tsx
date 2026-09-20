'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { submitFeedbackAction } from '@/application/actions/connectionActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

type FeedbackFormProps = {
  exchangeId: string
  toUserId: string
  companionName: string
  onSubmitted?: () => void
}

type RatingField = 'reliability' | 'communication' | 'boundaryRespect' | 'consideration' | 'followThrough'

const ratingLabels: Record<RatingField, string> = {
  reliability: 'Reliability',
  communication: 'Communication',
  boundaryRespect: 'Boundary respect',
  consideration: 'Consideration',
  followThrough: 'Follow-through',
}

export function FeedbackForm({ exchangeId, toUserId, companionName, onSubmitted }: FeedbackFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [ratings, setRatings] = useState<Record<RatingField, number>>({
    reliability: 3,
    communication: 3,
    boundaryRespect: 3,
    consideration: 3,
    followThrough: 3,
  })
  const [comments, setComments] = useState('')
  const [skills, setSkills] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit() {
    setIsSubmitting(true)
    setError(null)
    const result = await submitFeedbackAction({
      exchangeId,
      toUserId,
      ...ratings,
      comments: comments || undefined,
      skillEndorsements: skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)
        .filter((skill, index, all) => all.indexOf(skill) === index)
        .slice(0, 10),
    })
    setIsSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    toast({ title: 'Feedback submitted', description: `Your review of ${companionName} is recorded.` })
    onSubmitted?.()
    router.refresh()
  }

  return (
    <Card>
      <CardHeader><CardTitle>Feedback for {companionName}</CardTitle><CardDescription>This review is attached to the completed Exchange and cannot be submitted for an unrelated member.</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {(Object.keys(ratingLabels) as RatingField[]).map((field) => (
            <div key={field} className="space-y-2">
              <label className="text-sm font-medium">{ratingLabels[field]}</label>
              <Select value={String(ratings[field])} onValueChange={(value) => setRatings((current) => ({ ...current, [field]: Number(value) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[1, 2, 3, 4, 5].map((value) => <SelectItem key={value} value={String(value)}>{value} / 5</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <Textarea value={comments} onChange={(event) => setComments(event.target.value)} placeholder="Optional comments" maxLength={2000} />
        <Input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Skill endorsements, comma-separated" maxLength={500} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button onClick={submit} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</Button>
      </CardContent>
    </Card>
  )
}
