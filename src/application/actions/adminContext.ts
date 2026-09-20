import 'server-only'

import { createClient } from '@/infrastructure/supabase/server'

export type AdminContext = {
  id: string
}

export async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Administrator authentication is required.')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,is_admin,is_suspended')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.is_admin || profile.is_suspended) {
    throw new Error('Administrator authorization is required.')
  }

  return { id: profile.id }
}
