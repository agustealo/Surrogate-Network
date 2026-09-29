'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { actionFailure, requireActiveMember, type ActionResult } from '@/application/actions/memberContext'
import {
  RecommendationEventService,
  type FypSafetyExposure,
} from '@/application/services/RecommendationEventService'
import { createClient } from '@/infrastructure/supabase/server'

const reportSchema = z.object({
  reportedUserId: z.string().uuid(),
  type: z.enum(['harassment', 'inappropriate_content', 'boundary_violation', 'spam', 'impersonation', 'other']),
  severity: z.enum(['low', 'medium', 'high']),
  description: z.string().trim().min(10, 'Please provide enough detail for moderation.').max(4000),
})

function logFypSafetyAttributionFailure(incidentType: 'block' | 'report', error: unknown): void {
  console.error(JSON.stringify({
    level: 'error',
    event: 'fyp_safety_attribution_failed',
    timestamp: new Date().toISOString(),
    incidentType,
    errorName: error instanceof Error ? error.name : 'NonErrorThrown',
  }))
}

async function resolveFypSafetyExposure(input: {
  actorId: string
  targetUserId: string
  incidentType: 'block' | 'report'
}): Promise<FypSafetyExposure | null> {
  try {
    return await new RecommendationEventService().resolveSafetyExposureForMember(input)
  } catch (error) {
    logFypSafetyAttributionFailure(input.incidentType, error)
    return null
  }
}

async function recordFypSafetySignal(input: {
  actorId: string
  targetUserId: string
  incidentType: 'block' | 'report'
  severity?: 'low' | 'medium' | 'high'
  exposure: FypSafetyExposure | null
}): Promise<void> {
  try {
    await new RecommendationEventService().recordSafetyIncidentFromExposure(input)
  } catch (error) {
    logFypSafetyAttributionFailure(input.incidentType, error)
  }
}

export async function blockMemberAction(targetUserId: string): Promise<ActionResult> {
  try {
    const actor = await requireActiveMember()
    const targetId = z.string().uuid().parse(targetUserId)
    if (targetId === actor.id) throw new Error('You cannot block your own account.')

    // Resolve recommendation provenance while the target's marketplace records
    // are still visible. The block RLS policy hides them immediately after the
    // block is persisted, so attribution must be captured before that boundary.
    const exposure = await resolveFypSafetyExposure({
      actorId: actor.id,
      targetUserId: targetId,
      incidentType: 'block',
    })

    const supabase = await createClient()
    const { error } = await supabase.from('blocks').upsert(
      { blocker_user_id: actor.id, blocked_user_id: targetId },
      { onConflict: 'blocker_user_id,blocked_user_id', ignoreDuplicates: true },
    )
    if (error) throw new Error(`Unable to block this member: ${error.message}`)

    await recordFypSafetySignal({
      actorId: actor.id,
      targetUserId: targetId,
      incidentType: 'block',
      exposure,
    })

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

    const exposure = await resolveFypSafetyExposure({
      actorId: actor.id,
      targetUserId: values.reportedUserId,
      incidentType: 'report',
    })

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

    await recordFypSafetySignal({
      actorId: actor.id,
      targetUserId: values.reportedUserId,
      incidentType: 'report',
      severity: values.severity,
      exposure,
    })

    revalidatePath(`/profile/${values.reportedUserId}`)
    return { ok: true, data: { id: data.id } }
  } catch (error) {
    return actionFailure(error)
  }
}
