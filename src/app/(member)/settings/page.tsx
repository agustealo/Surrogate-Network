import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AccountDataActions } from '@/components/account/AccountDataActions'
import { AccountParticipationControls } from '@/components/account/AccountParticipationControls'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/infrastructure/supabase/server'
import { routes } from '@/lib/routes'

export const metadata: Metadata = {
  title: 'Settings - Surrogate Network',
  description: 'Review your account, recommendation choices, privacy, and data controls.',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(routes.public.login)

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('name,email,location,availability,verification_status')
    .eq('id', user.id)
    .single()
  if (error || !profile) throw new Error('Unable to load account settings.')

  return (
    <PageWrapper title="Settings" className="mx-auto max-w-4xl">
      <p className="-mt-5 mb-6 text-muted-foreground">
        Review your account information, control what you see in Discover, and manage your privacy and data.
      </p>
      <nav aria-label="Settings sections" className="mb-8 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><a href="#account">Account</a></Button>
        <Button asChild variant="outline" size="sm"><a href="#discovery">Discovery</a></Button>
        <Button asChild variant="outline" size="sm"><a href="#privacy">Privacy & safety</a></Button>
        <Button asChild variant="outline" size="sm"><a href="#data">Your data</a></Button>
        <Button asChild variant="outline" size="sm"><a href="#participation">Participation</a></Button>
      </nav>

      <div className="grid gap-6">
        <section id="account" aria-labelledby="account-title" className="scroll-mt-6">
          <Card>
            <CardHeader>
              <CardTitle id="account-title">Your account</CardTitle>
              <CardDescription>These are the details currently associated with your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div><dt className="text-sm text-muted-foreground">Name</dt><dd className="font-medium">{profile.name}</dd></div>
                <div><dt className="text-sm text-muted-foreground">Email</dt><dd className="break-all font-medium">{profile.email}</dd></div>
                <div><dt className="text-sm text-muted-foreground">Verification</dt><dd className="font-medium">{profile.verification_status}</dd></div>
              </dl>
              <Button asChild variant="outline"><Link href={routes.member.profile}>View my public profile</Link></Button>
            </CardContent>
          </Card>
        </section>

        <section id="discovery" aria-labelledby="discovery-title" className="scroll-mt-6">
          <Card>
            <CardHeader>
              <CardTitle id="discovery-title">Discovery & recommendations</CardTitle>
              <CardDescription>Understand the profile details used in discovery and manage the listings you have saved or hidden.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div><dt className="text-sm text-muted-foreground">Location</dt><dd>{profile.location || 'Not provided'}</dd></div>
                <div><dt className="text-sm text-muted-foreground">Availability</dt><dd>{profile.availability || 'Not provided'}</dd></div>
              </dl>
              <p className="text-sm text-muted-foreground">
                Your current saved and hidden recommendations can be reviewed or restored. Profile details are shown here as read-only because editing is not yet available in this settings page.
              </p>
              <Button asChild><Link href={routes.member.recommendationPreferences}>Manage saved & hidden recommendations</Link></Button>
            </CardContent>
          </Card>
        </section>

        <section id="privacy" aria-labelledby="privacy-title" className="scroll-mt-6">
          <Card>
            <CardHeader>
              <CardTitle id="privacy-title">Privacy & safety</CardTitle>
              <CardDescription>Review your blocked members and understand how your information is handled.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild variant="outline"><Link href={routes.member.blockedMembers}>Manage blocked members</Link></Button>
              <Button asChild variant="outline"><Link href={routes.public.privacy}>Privacy Notice</Link></Button>
              <Button asChild variant="outline"><Link href={routes.public.terms}>Trial Terms</Link></Button>
              <Button asChild variant="outline"><Link href={routes.public.safety}>Safety guidance</Link></Button>
            </CardContent>
          </Card>
        </section>

        <section id="data" aria-labelledby="data-title" className="scroll-mt-6">
          <Card>
            <CardHeader>
              <CardTitle id="data-title">Your data & account deletion</CardTitle>
              <CardDescription>Export your information or permanently close your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your export includes member-facing profile and activity data. Internal moderation, anti-abuse, audit and security records are excluded.
                Account deletion terminates access and redacts direct profile and listing content. Some shared relationship and safety records may remain to preserve other members&apos; history and platform integrity.
              </p>
              <AccountDataActions />
            </CardContent>
          </Card>
        </section>

        <section id="participation" aria-labelledby="participation-title" className="scroll-mt-6">
          <Card>
            <CardHeader>
              <CardTitle id="participation-title">Pause participation</CardTitle>
              <CardDescription>Take a break without deleting your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Deactivation stops your participation in marketplace and relationship activities. You can reactivate your account later. Existing safety, audit and relationship records are retained.
              </p>
              <AccountParticipationControls mode="deactivate" />
            </CardContent>
          </Card>
        </section>
      </div>
    </PageWrapper>
  )
}
