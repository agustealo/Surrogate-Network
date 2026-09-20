import 'server-only'

import { createClient } from '@/infrastructure/supabase/server'

export type ActiveMemberContext = {
  id: string
  name: string
  avatarUrl?: string
}

export async function requireActiveMember(): Promise<ActiveMemberContext> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('You must be signed in to continue.')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,name,avatar_url,is_suspended')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) throw new Error('Your member profile is unavailable.')
  if (profile.is_suspended) throw new Error('This account is not permitted to perform member actions.')

  return {
    id: profile.id,
    name: profile.name,
    avatarUrl: profile.avatar_url ?? undefined,
  }
}

export function actionFailure(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : 'The request could not be completed.' }
}
