import { redirect } from 'next/navigation'
import { createClient } from '@/infrastructure/supabase/server'
import { routes } from '@/lib/routes'

export default async function CreateProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(routes.public.login)

  const { data: profile, error } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
  if (error) throw new Error(`Failed to resolve profile state: ${error.message}`)
  if (profile) redirect(routes.memberDynamic.profile(profile.id))

  redirect(routes.member.settings)
}
