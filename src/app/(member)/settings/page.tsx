import Link from 'next/link';
import type { Metadata } from 'next';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/infrastructure/supabase/server';

export const metadata: Metadata = { title: 'Settings - Surrogate Network', description: 'Manage your Surrogate Network account.' };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile, error } = await supabase.from('profiles').select('name,email,location,availability,verification_status').eq('id', user!.id).single();
  if (error) throw new Error('Unable to load account settings.');

  return <PageWrapper title="Account Settings" className="max-w-4xl mx-auto"><div className="grid gap-6">
    <Card><CardHeader><CardTitle>Account</CardTitle><CardDescription>Authenticated account information.</CardDescription></CardHeader><CardContent className="space-y-2"><p><span className="font-medium">Name:</span> {profile.name}</p><p><span className="font-medium">Email:</span> {profile.email}</p><p><span className="font-medium">Verification:</span> {profile.verification_status}</p><Button asChild className="mt-3"><Link href="/profile">Manage profile</Link></Button></CardContent></Card>
    <Card><CardHeader><CardTitle>Availability & location</CardTitle><CardDescription>Current matching context stored on your profile.</CardDescription></CardHeader><CardContent className="space-y-2"><p><span className="font-medium">Location:</span> {profile.location || 'Not set'}</p><p><span className="font-medium">Availability:</span> {profile.availability || 'Not set'}</p></CardContent></Card>
    <Card><CardHeader><CardTitle>Privacy, notifications & premium</CardTitle><CardDescription>These controls are not exposed until their persisted policy and entitlement models are deployed.</CardDescription></CardHeader><CardContent><p className="text-muted-foreground">The app will not present decorative toggles or purchase buttons that do not execute real server-authoritative behavior.</p></CardContent></Card>
  </div></PageWrapper>;
}
