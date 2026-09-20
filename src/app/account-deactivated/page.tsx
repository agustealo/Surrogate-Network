import { redirect } from 'next/navigation'
import { PauseCircle } from 'lucide-react'
import { AccountParticipationControls } from '@/components/account/AccountParticipationControls'
import { RestrictedAccountActions } from '@/components/account/RestrictedAccountActions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/infrastructure/supabase/server'

export default async function AccountDeactivatedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_suspended,trial_deactivated_at')
    .eq('id', user.id)
    .single()

  if (error || !profile) redirect('/login')
  if (profile.is_suspended) redirect('/account-restricted')
  if (!profile.trial_deactivated_at) redirect('/home')

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
        </CardContent>
      </Card>
    </main>
  )
}
