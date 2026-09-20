import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Toaster } from '@/components/ui/toaster'
import { MemberNavigation } from '@/components/member/MemberNavigation'
import { MemberHeader } from '@/components/member/MemberHeader'
import { MobileNavigation } from '@/components/member/MobileNavigation'
import { createClient } from '@/infrastructure/supabase/server'

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
    .select('is_suspended')
    .eq('id', user.id)
    .single()

  if (error || !profile) redirect('/login')
  if (profile.is_suspended) redirect('/account-restricted')

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
