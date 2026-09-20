import { redirect } from 'next/navigation'
import { createClient } from '@/infrastructure/supabase/server'

export default async function MemberProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  redirect(`/profile/${user.id}`)
}
