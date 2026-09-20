import Link from 'next/link'
import { UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { routes } from '@/lib/routes'

export default async function AccountDeletedPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>
}) {
  const { auth } = await searchParams
  const authPending = auth === 'pending'

  return (
    <main className="container mx-auto flex min-h-screen max-w-2xl items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <UserX className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold leading-none tracking-tight">Account deleted</h1>
          <CardDescription>
            Your Surrogate Network member access is permanently disabled and direct profile/listing content has been redacted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Shared relationship, safety, moderation, and audit records can remain in redacted or tombstoned form where removing them would damage another member&apos;s history or platform integrity.
          </p>
          {authPending && (
            <p role="status" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              The application account is already disabled and redacted. External authentication cleanup did not complete during this request, so the identity is recorded for operational follow-up while database access remains fail-closed.
            </p>
          )}
          <Button asChild><Link href={routes.public.home}>Return to home</Link></Button>
        </CardContent>
      </Card>
    </main>
  )
}
