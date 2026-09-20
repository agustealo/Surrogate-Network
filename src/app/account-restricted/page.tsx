import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { AccountDataActions } from '@/components/account/AccountDataActions'
import { RestrictedAccountActions } from '@/components/account/RestrictedAccountActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/infrastructure/supabase/server'
import { routes } from '@/lib/routes'

export default async function AccountRestrictedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(routes.public.login)

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_suspended,trial_deleted_at')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.trial_deleted_at) redirect(routes.public.accountDeleted)
  if (profile && !profile.is_suspended) redirect(routes.member.home)

  return (
    <main className="container mx-auto flex min-h-screen max-w-2xl items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10"><ShieldAlert className="h-6 w-6 text-destructive" /></div>
          <CardTitle>Account access restricted</CardTitle>
          <CardDescription>Your account is currently restricted from member operations. Existing authentication remains available so you can review this status, access your data, delete the account, or sign out safely.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">Core marketplace, proposal, relationship, scheduling, feedback, and ledger operations are blocked at the database boundary while the restriction is active.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary"><Link href={routes.public.safety}>Review safety guidance</Link></Button>
            <RestrictedAccountActions />
          </div>
          <div className="border-t pt-5">
            <p className="mb-3 text-sm text-muted-foreground">Restriction does not remove your ability to export your member-facing data or permanently delete the account.</p>
            <AccountDataActions />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
