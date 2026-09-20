'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { createNeedAction } from '@/application/actions/marketplaceActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

const boundaryValues = ['platonic', 'romantic', 'physical', 'virtual', 'one-off', 'recurring'] as const

const needFormSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(1000),
  category: z.enum(['personal', 'utilitarian_business', 'casual']),
  locationMode: z.enum(['remote', 'local', 'either']),
  timing: z.string().trim().max(500),
  urgency: z.enum(['low', 'medium', 'high']),
  boundaries: z.array(z.enum(boundaryValues)).min(1, 'Select at least one boundary.'),
  tags: z.string().max(300),
})

export type NeedFormValues = z.infer<typeof needFormSchema>

type NeedFormProps = {
  onSuccess?: (needId: string) => void
  onCancel?: () => void
}

export function NeedForm({ onSuccess, onCancel }: NeedFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const form = useForm<NeedFormValues>({
    resolver: zodResolver(needFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'personal',
      locationMode: 'either',
      timing: '',
      urgency: 'medium',
      boundaries: ['platonic'],
      tags: '',
    },
  })

  async function onSubmit(values: NeedFormValues) {
    const result = await createNeedAction({
      ...values,
      timing: values.timing || undefined,
      tags: values.tags
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .filter((tag, index, all) => all.indexOf(tag) === index)
        .slice(0, 10),
    })

    if (!result.ok) {
      form.setError('root', { message: result.error })
      return
    }

    toast({ title: 'Need published', description: 'Your Need is live in Discover.' })
    onSuccess?.(result.data.id)
    router.push(`/needs/${result.data.id}`)
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>What do you need?</CardTitle>
            <CardDescription>Publish a real request that other members can pair with an Offer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea className="min-h-32" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid gap-5 md:grid-cols-3">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="personal">Personal</SelectItem><SelectItem value="utilitarian_business">Utilitarian / Business</SelectItem><SelectItem value="casual">Casual</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="locationMode" render={({ field }) => (
                <FormItem><FormLabel>Location</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="remote">Remote</SelectItem><SelectItem value="local">Local</SelectItem><SelectItem value="either">Either</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="urgency" render={({ field }) => (
                <FormItem><FormLabel>Urgency</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="timing" render={({ field }) => (
              <FormItem><FormLabel>Timing</FormLabel><FormControl><Input placeholder="Weekend mornings, flexible, after 6 PM..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="tags" render={({ field }) => (
              <FormItem><FormLabel>Tags</FormLabel><FormControl><Input placeholder="conversation, moving, study" {...field} /></FormControl><FormDescription>Comma-separated. These are descriptive tags, not AI-generated claims.</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="boundaries" render={({ field }) => (
              <FormItem>
                <FormLabel>Boundaries</FormLabel>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {boundaryValues.map((boundary) => (
                    <label key={boundary} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={field.value.includes(boundary)}
                        onChange={(event) => field.onChange(event.target.checked ? [...field.value, boundary] : field.value.filter((value) => value !== boundary))}
                      />
                      <span className="capitalize">{boundary.replace('-', ' ')}</span>
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />
            {form.formState.errors.root?.message && <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p>}
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {form.formState.isSubmitting ? 'Publishing...' : 'Publish Need'}
          </Button>
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        </div>
      </form>
    </Form>
  )
}
