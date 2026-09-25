import { MemberShell } from '@/components/layout/MemberShell'
import { PublicShell } from '@/components/layout/PublicShell'
import { createClient } from '@/infrastructure/supabase/server'

export default async function ProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Public profiles remain publicly readable. Authentication only selects the
  // appropriate product chrome; authorization stays with the route/action
  // authorities that own it.
  return user
    ? <MemberShell>{children}</MemberShell>
    : <PublicShell>{children}</PublicShell>
}
