import { redirect } from 'next/navigation'
import { PauseCircle } from 'lucide-react'
import { AccountDataActions } from '@/components/account/AccountDataActions'
import { AccountParticipationControls } from '@/components/account/AccountParticipationControls'
import { RestrictedAccountActions } from '@/components/account/RestrictedAccountActions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/infrastructure/supabase/server'
import { routes } from '@/lib/routes'

export default async function AccountDeactivatedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(routes.public.login)

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_suspended,trial_deactivated_at,trial_deleted_at')
    .eq('id', user.id)
    .single()

  if (error || !profile) redirect(routes.public.login)
  if (profile.trial_deleted_at) redirect(routes.public.accountDeleted)
  if (profile.is_suspended) redirect(routes.public.accountRestricted)
  if (!profile.trial_deactivated_at) redirect(routes.member.home)

  return (
    <main className="container mx-auto flex min-h-screen max-w-2xl items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted"><PauseCircle className="h-6 w-6" /></div>
          <CardTitle>Consumer trial account deactivated</CardTitle>
          <CardDescription>
            Your authentication remains available, but marketplace and relationship operations are disabled until you reactivate participation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Deactivation does not erase records needed to preserve other members&apos; relationship history, moderation evidence, security logs, or audit integrity.
          </p>
          <div className="flex flex-wrap gap-3">
            <AccountParticipationControls mode="reactivate" />
            <RestrictedAccountActions />
          </div>
          <div className="border-t pt-5">
            <p className="mb-3 text-sm text-muted-foreground">You can still export your data or permanently delete the account while participation is paused.</p>
            <AccountDataActions />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
