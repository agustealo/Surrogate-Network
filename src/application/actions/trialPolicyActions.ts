'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { actionFailure, type ActionResult } from '@/application/actions/memberContext'
import { createClient } from '@/infrastructure/supabase/server'
import { TRIAL_POLICY_VERSION } from '@/lib/trialPolicy'

const consentSchema = z.object({
  confirmed: z.literal(true),
})

type ConsentRpcClient = {
  rpc<T>(name: string, args: Record<string, unknown>): PromiseLike<{
    data: T | null
    error: { message: string } | null
  }>
}

export async function acceptTrialPolicyAction(input: unknown): Promise<ActionResult> {
  try {
    consentSchema.parse(input)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Sign in before accepting the trial policy.')

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,is_suspended')
      .eq('id', user.id)
      .single()
    if (profileError || !profile) throw new Error('Your member profile is unavailable.')
    if (profile.is_suspended) throw new Error('A restricted account cannot re-enter the trial through policy acceptance.')

    const rpc = supabase as unknown as ConsentRpcClient
    const { error } = await rpc.rpc<void>('accept_current_trial_policy', {
      p_terms_version: TRIAL_POLICY_VERSION,
      p_privacy_version: TRIAL_POLICY_VERSION,
      p_age_confirmed: true,
    })
    if (error) throw new Error(`Unable to record trial consent: ${error.message}`)

    revalidatePath('/home')
    revalidatePath('/trial-consent')
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}
