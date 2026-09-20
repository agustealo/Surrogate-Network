import Link from 'next/link'
import type { Metadata } from 'next'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/infrastructure/supabase/server'

export const metadata: Metadata = {
  title: 'Settings - Surrogate Network',
  description: 'Manage your Surrogate Network account.',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('name,email,location,availability,verification_status')
    .eq('id', user!.id)
    .single()
  if (error) throw new Error('Unable to load account settings.')

  return (
    <PageWrapper title="Account Settings" className="mx-auto max-w-4xl">
      <div className="grid gap-6">
        <Card>
          <CardHeader><CardTitle>Account</CardTitle><CardDescription>Authenticated account information.</CardDescription></CardHeader>
          <CardContent className="space-y-2"><p><span className="font-medium">Name:</span> {profile.name}</p><p><span className="font-medium">Email:</span> {profile.email}</p><p><span className="font-medium">Verification:</span> {profile.verification_status}</p><Button asChild className="mt-3"><Link href="/profile">Manage profile</Link></Button></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Availability & location</CardTitle><CardDescription>Current discovery context stored on your profile.</CardDescription></CardHeader>
          <CardContent className="space-y-2"><p><span className="font-medium">Location:</span> {profile.location || 'Not set'}</p><p><span className="font-medium">Availability:</span> {profile.availability || 'Not set'}</p></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Safety & privacy</CardTitle><CardDescription>Controls that are backed by persisted product behavior.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-3"><Button asChild variant="outline"><Link href="/settings/blocked">Blocked members</Link></Button><Button asChild variant="outline"><Link href="/privacy">Privacy</Link></Button><Button asChild variant="outline"><Link href="/terms">Terms</Link></Button><Button asChild variant="outline"><Link href="/safety">Safety</Link></Button></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notifications & premium</CardTitle><CardDescription>These controls stay hidden until their persisted preference and entitlement models exist.</CardDescription></CardHeader>
          <CardContent><p className="text-muted-foreground">The trial build does not present decorative toggles or purchase buttons that cannot execute real server-authoritative behavior.</p></CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}
