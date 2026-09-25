'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { actionFailure, requireActiveMember, type ActionResult } from '@/application/actions/memberContext'
import { createClient } from '@/infrastructure/supabase/server'

const reportSchema = z.object({
  reportedUserId: z.string().uuid(),
  type: z.enum(['harassment', 'inappropriate_content', 'boundary_violation', 'spam', 'impersonation', 'other']),
  severity: z.enum(['low', 'medium', 'high']),
  description: z.string().trim().min(10, 'Please provide enough detail for moderation.').max(4000),
})

export async function blockMemberAction(targetUserId: string): Promise<ActionResult> {
  try {
    const actor = await requireActiveMember()
    const targetId = z.string().uuid().parse(targetUserId)
    if (targetId === actor.id) throw new Error('You cannot block your own account.')

    const supabase = await createClient()
    const { error } = await supabase.from('blocks').upsert(
      { blocker_user_id: actor.id, blocked_user_id: targetId },
      { onConflict: 'blocker_user_id,blocked_user_id', ignoreDuplicates: true },
    )
    if (error) throw new Error(`Unable to block this member: ${error.message}`)

    revalidatePath('/discover')
    revalidatePath('/proposals')
    revalidatePath('/surrogacies')
    revalidatePath('/settings/blocked')
    revalidatePath(`/profile/${targetId}`)
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}

export async function unblockMemberAction(targetUserId: string): Promise<ActionResult> {
  try {
    const actor = await requireActiveMember()
    const targetId = z.string().uuid().parse(targetUserId)
    const supabase = await createClient()
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_user_id', actor.id)
      .eq('blocked_user_id', targetId)
    if (error) throw new Error(`Unable to unblock this member: ${error.message}`)

    revalidatePath('/discover')
    revalidatePath('/proposals')
    revalidatePath('/settings/blocked')
    revalidatePath(`/profile/${targetId}`)
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}

export async function reportMemberAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireActiveMember()
    const values = reportSchema.parse(input)
    if (values.reportedUserId === actor.id) throw new Error('You cannot report your own account.')

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reported_user_id: values.reportedUserId,
        reporter_user_id: actor.id,
        type: values.type,
        severity: values.severity,
        description: values.description,
      })
      .select('id')
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Unable to submit this report.')
    revalidatePath(`/profile/${values.reportedUserId}`)
    return { ok: true, data: { id: data.id } }
  } catch (error) {
    return actionFailure(error)
  }
}