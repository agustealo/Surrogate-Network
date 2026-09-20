'use server'

import { revalidatePath } from 'next/cache'
import { actionFailure, type ActionResult } from '@/application/actions/memberContext'
import { createClient } from '@/infrastructure/supabase/server'

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

    const { error } = await supabase.rpc('set_trial_account_participation', {
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
