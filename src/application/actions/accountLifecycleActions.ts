'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { actionFailure, type ActionResult } from '@/application/actions/memberContext'
import { removePreparedAuthIdentity } from '@/infrastructure/supabase/accountDeletionCoordinator'
import { createClient } from '@/infrastructure/supabase/server'

const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  confirmation: z.string().refine((value) => value === 'DELETE', {
    message: 'Type DELETE exactly to confirm permanent account deletion.',
  }),
})

export type AccountDeletionResult = {
  authRemoved: boolean
}

export async function setTrialParticipationAction(active: boolean): Promise<ActionResult> {
  try {
    if (typeof active !== 'boolean') throw new Error('Invalid participation state.')

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Sign in to manage trial participation.')

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,is_suspended,trial_deactivated_at,trial_deleted_at')
      .eq('id', user.id)
      .single()
    if (profileError || !profile) throw new Error('Your member profile is unavailable.')
    if (profile.trial_deleted_at) throw new Error('A deleted account cannot be reactivated.')
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

export async function deleteAccountAction(input: unknown): Promise<ActionResult<AccountDeletionResult>> {
  try {
    const values = deleteAccountSchema.parse(input)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.email) throw new Error('You must be signed in to delete this account.')

    const { data: confirmed, error: passwordError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: values.currentPassword,
    })
    if (passwordError || confirmed.user?.id !== user.id) {
      throw new Error('Current password confirmation failed.')
    }

    const { error: prepareError } = await supabase.rpc('prepare_trial_account_deletion')
    if (prepareError) throw new Error(`Unable to prepare account deletion: ${prepareError.message}`)

    await supabase.auth.signOut({ scope: 'local' })

    let authRemoved = false
    try {
      const result = await removePreparedAuthIdentity(user.id)
      authRemoved = result.authRemoved
    } catch {
      // Postgres is already terminal and fail-closed. A provider cleanup failure
      // is surfaced to the terminal page as pending rather than rolling back the
      // deletion tombstone or pretending the account remains active.
      authRemoved = false
    }

    revalidatePath('/settings')
    revalidatePath('/account-deactivated')
    revalidatePath('/account-restricted')
    return { ok: true, data: { authRemoved } }
  } catch (error) {
    return actionFailure(error)
  }
}
