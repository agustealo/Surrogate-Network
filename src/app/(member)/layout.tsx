import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { MemberShell } from '@/components/layout/MemberShell'
import { createClient } from '@/infrastructure/supabase/server'
import { routes } from '@/lib/routes'
import { TRIAL_POLICY_VERSION } from '@/lib/trialPolicy'

export const metadata: Metadata = {
  title: 'Surrogate Network - Member Area',
  description: 'Your personal connection space.',
}

export default async function MemberLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(routes.public.login)

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_suspended,trial_deactivated_at,trial_deleted_at,trial_terms_version,trial_terms_accepted_at,trial_privacy_version,trial_privacy_accepted_at,trial_age_confirmed_at')
    .eq('id', user.id)
    .single()

  if (error || !profile) redirect(routes.public.login)
  if (profile.trial_deleted_at) redirect(routes.public.accountDeleted)
  if (profile.is_suspended) redirect(routes.public.accountRestricted)
  if (profile.trial_deactivated_at) redirect(routes.public.accountDeactivated)

  const hasCurrentConsent = profile.trial_terms_version === TRIAL_POLICY_VERSION
    && Boolean(profile.trial_terms_accepted_at)
    && profile.trial_privacy_version === TRIAL_POLICY_VERSION
    && Boolean(profile.trial_privacy_accepted_at)
    && Boolean(profile.trial_age_confirmed_at)
  if (!hasCurrentConsent) redirect(routes.public.trialConsent)

  return <MemberShell>{children}</MemberShell>
}
