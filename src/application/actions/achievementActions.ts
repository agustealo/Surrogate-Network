'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/application/actions/adminContext'
import { actionFailure, type ActionResult } from '@/application/actions/memberContext'

const achievementPolicySchema = z.object({
  code: z.string().regex(/^[a-z][a-z0-9_]{2,63}$/),
  enabled: z.boolean(),
  reason: z.string().trim().min(8).max(240),
}).strict()

export async function setAchievementRuleEnabledAction(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    const values = achievementPolicySchema.parse(input)
    const { error } = await admin.supabase.rpc('set_achievement_rule_enabled', {
      p_code: values.code,
      p_enabled: values.enabled,
      p_reason: values.reason,
    })
    if (error) {
      throw new Error('The achievement rule could not be changed. Refresh its current state and try again.')
    }

    revalidatePath('/admin/achievements')
    revalidatePath('/rewards')
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}
