import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrialConsentForm } from '@/components/forms/TrialConsentForm'
import { createClient } from '@/infrastructure/supabase/server'
import { TRIAL_POLICY_VERSION } from '@/lib/trialPolicy'

export default async function TrialConsentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/trial-consent')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_suspended,trial_terms_version,trial_privacy_version,trial_age_confirmed_at')
    .eq('id', user.id)
    .single()

  if (error || !profile) redirect('/login')
  if (profile.is_suspended) redirect('/account-restricted')

  const current = profile.trial_terms_version === TRIAL_POLICY_VERSION
    && profile.trial_privacy_version === TRIAL_POLICY_VERSION
    && Boolean(profile.trial_age_confirmed_at)
  if (current) redirect('/home')

  return (
    <main className="container mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Consumer Trial Consent</CardTitle>
          <CardDescription>
            Review and accept the current trial terms before using member features. This is required for existing accounts created before the current trial policy version.
          </CardDescription>
        </CardHeader>
        <CardContent><TrialConsentForm /></CardContent>
      </Card>
    </main>
  )
}
