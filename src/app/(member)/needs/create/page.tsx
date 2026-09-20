import type { Metadata } from 'next'
import { NeedForm } from '@/components/forms/NeedForm'
import { PageWrapper } from '@/components/layout/PageWrapper'

export const metadata: Metadata = {
  title: 'Create Need - Surrogate Network',
  description: 'Publish a Need for other members to discover and pair with an Offer.',
}

export default function CreateNeedPage() {
  return (
    <PageWrapper title="Create a Need" className="mx-auto max-w-3xl">
      <p className="mb-8 text-muted-foreground">
        Describe the connection or help you are looking for. Your Need is persisted immediately and can be used in a proposal once published.
      </p>
      <NeedForm />
    </PageWrapper>
  )
}
