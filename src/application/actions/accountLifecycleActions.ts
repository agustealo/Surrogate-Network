'use server'

import { revalidatePath } from 'next/cache'
import { actionFailure, type ActionResult } from '@/application/actions/memberContext'
import { createClient, createServiceClient } from '@/infrastructure/supabase/server'

type ParticipationRpcClient = {
  rpc<T>(name: string, args: Record<string, unknown>): PromiseLike<{
    data: T | null
    error: { message: string } | null
  }>
}

export async function setTrialParticipationAction(active: boolean): Promise<ActionResult> {
  try {
    if (typeof active !== 'boolean') throw new Error('Invalid participation state.')

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Sign in to manage trial participation.')

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,is_suspended,trial_deactivated_at')
      .eq('id', user.id)
      .single()
    if (profileError || !profile) throw new Error('Your member profile is unavailable.')
    if (active && profile.is_suspended) throw new Error('A restricted account cannot reactivate itself.')

    const rpc = createServiceClient() as unknown as ParticipationRpcClient
    const { error } = await rpc.rpc<void>('set_trial_account_participation', {
      p_user_id: user.id,
      p_active: active,
    })
    if (error) throw new Error(`Unable to update trial participation: ${error.message}`)

    revalidatePath('/home')
    revalidatePath('/settings')
    revalidatePath('/account-deactivated')
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}
