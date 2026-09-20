import 'server-only'

import { createClient } from '@/infrastructure/supabase/server'

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export type ActiveMemberContext = {
  id: string
  name: string
  avatarUrl?: string
  supabase: Awaited<ReturnType<typeof createClient>>
}

export async function requireActiveMember(): Promise<ActiveMemberContext> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('You must be signed in to continue.')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,name,avatar_url,is_suspended,trial_deactivated_at,trial_deleted_at')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) throw new Error('Your member profile is unavailable.')
  if (profile.trial_deleted_at) throw new Error('This account has been permanently deleted.')
  if (profile.is_suspended) throw new Error('This account is not permitted to perform member actions.')
  if (profile.trial_deactivated_at) throw new Error('Reactivate your account before performing member actions.')

  return {
    id: profile.id,
    name: profile.name,
    avatarUrl: profile.avatar_url ?? undefined,
    supabase,
  }
}

export function actionFailure(error: unknown): ActionResult<never> {
  return { ok: false, error: error instanceof Error ? error.message : 'The request could not be completed.' }
}
