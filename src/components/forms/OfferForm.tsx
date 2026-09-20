'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { createOfferAction } from '@/application/actions/marketplaceActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

const boundaryValues = ['platonic', 'romantic', 'physical', 'virtual', 'one-off', 'recurring'] as const

const offerFormSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(1000),
  category: z.enum(['personal', 'utilitarian_business', 'casual']),
  locationMode: z.enum(['remote', 'local', 'either']),
  timing: z.string().trim().max(500),
  boundaries: z.array(z.enum(boundaryValues)).min(1, 'Select at least one boundary.'),
  capacity: z.coerce.number().int().min(1).max(50).optional().or(z.literal('')),
})

type OfferFormValues = z.infer<typeof offerFormSchema>

type OfferFormProps = {
  onSuccess?: (offerId: string) => void
  onCancel?: () => void
}

export function OfferForm({ onSuccess, onCancel }: OfferFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'personal',
      locationMode: 'either',
      timing: '',
      boundaries: ['platonic'],
      capacity: '',
    },
  })

  async function onSubmit(values: OfferFormValues) {
    const result = await createOfferAction({
      ...values,
      timing: values.timing || undefined,
      capacity: values.capacity === '' ? undefined : values.capacity,
    })

    if (!result.ok) {
      form.setError('root', { message: result.error })
      return
    }

    toast({ title: 'Offer published', description: 'Your Offer is live in Discover.' })
    onSuccess?.(result.data.id)
    router.push(`/offers/${result.data.id}`)
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>What can you offer?</CardTitle>
            <CardDescription>Publish a real Offer that can be paired with another member&apos;s Need.</CardDescription>
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
              <FormField control={form.control} name="capacity" render={({ field }) => (
                <FormItem><FormLabel>Capacity</FormLabel><FormControl><Input type="number" min={1} max={50} placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="timing" render={({ field }) => (
              <FormItem><FormLabel>Timing</FormLabel><FormControl><Input placeholder="Weekends, evenings, flexible..." {...field} /></FormControl><FormMessage /></FormItem>
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
            {form.formState.isSubmitting ? 'Publishing...' : 'Publish Offer'}
          </Button>
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        </div>
      </form>
    </Form>
  )
}
