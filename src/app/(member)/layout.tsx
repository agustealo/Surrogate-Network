import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Toaster } from '@/components/ui/toaster'
import { MemberNavigation } from '@/components/member/MemberNavigation'
import { MemberHeader } from '@/components/member/MemberHeader'
import { MobileNavigation } from '@/components/member/MobileNavigation'
import { createClient } from '@/infrastructure/supabase/server'
import { TRIAL_POLICY_VERSION } from '@/lib/trialPolicy'

export const metadata: Metadata = {
  title: 'Surrogate Network - Member Area',
  description: 'Your personal connection space.',
}

export default async function MemberLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_suspended,trial_terms_version,trial_terms_accepted_at,trial_privacy_version,trial_privacy_accepted_at,trial_age_confirmed_at')
    .eq('id', user.id)
    .single()

  if (error || !profile) redirect('/login')
  if (profile.is_suspended) redirect('/account-restricted')

  const hasCurrentConsent = profile.trial_terms_version === TRIAL_POLICY_VERSION
    && Boolean(profile.trial_terms_accepted_at)
    && profile.trial_privacy_version === TRIAL_POLICY_VERSION
    && Boolean(profile.trial_privacy_accepted_at)
    && Boolean(profile.trial_age_confirmed_at)
  if (!hasCurrentConsent) redirect('/trial-consent')

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MemberHeader />
      <div className="flex flex-1">
        <MemberNavigation />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>
      <MobileNavigation />
      <Toaster />
    </div>
  )
}
