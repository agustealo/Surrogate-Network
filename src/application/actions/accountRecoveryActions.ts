'use server'

import { cookies } from 'next/headers'
import { z } from 'zod'
import { actionFailure, type ActionResult } from '@/application/actions/memberContext'
import { createClient } from '@/infrastructure/supabase/server'
import { RECOVERY_COOKIE } from '@/lib/authRecovery'

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128, 'Password is too long.'),
})

export async function completePasswordRecoveryAction(input: unknown): Promise<ActionResult> {
  try {
    const { password } = passwordSchema.parse(input)
    const cookieStore = await cookies()
    if (cookieStore.get(RECOVERY_COOKIE)?.value !== '1') {
      throw new Error('This password recovery session is invalid or expired.')
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('This password recovery session is invalid or expired.')

    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(`Unable to update password: ${error.message}`)

    cookieStore.delete(RECOVERY_COOKIE)
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}
