import type { Metadata } from 'next'
import { OfferForm } from '@/components/forms/OfferForm'
import { PageWrapper } from '@/components/layout/PageWrapper'

export const metadata: Metadata = {
  title: 'Create Offer - Surrogate Network',
  description: 'Publish an Offer that can be paired with another member’s Need.',
}

export default function CreateOfferPage() {
  return (
    <PageWrapper title="Create an Offer" className="mx-auto max-w-3xl">
      <p className="mb-8 text-muted-foreground">
        Describe what you can provide. Capacity and reputation are server-authoritative and cannot be changed by the browser.
      </p>
      <OfferForm />
    </PageWrapper>
  )
}
