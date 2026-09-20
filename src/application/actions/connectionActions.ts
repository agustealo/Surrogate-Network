'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { actionFailure, requireActiveMember, type ActionResult } from '@/application/actions/memberContext'

type RpcResponse<T> = { data: T | null; error: { message: string } | null }
type TrialRpcClient = {
  rpc<T>(name: string, args: Record<string, unknown>): PromiseLike<RpcResponse<T>>
}

const scheduleSchema = z.object({
  surrogacyId: z.string().uuid(),
  scheduledTime: z.string().datetime(),
  duration: z.number().int().min(15).max(1440),
  location: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(2000).optional(),
})

const feedbackSchema = z.object({
  exchangeId: z.string().uuid(),
  toUserId: z.string().uuid(),
  reliability: z.number().int().min(1).max(5),
  communication: z.number().int().min(1).max(5),
  boundaryRespect: z.number().int().min(1).max(5),
  consideration: z.number().int().min(1).max(5),
  followThrough: z.number().int().min(1).max(5),
  comments: z.string().trim().max(2000).optional(),
  skillEndorsements: z.array(z.string().trim().min(1).max(80)).max(10).default([]),
})

function rpcClient(client: unknown): TrialRpcClient {
  return client as TrialRpcClient
}

export async function createMomentAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireActiveMember()
    const values = scheduleSchema.parse(input)
    const { data, error } = await rpcClient(actor.supabase).rpc<string>('create_moment_for_trial', {
      p_surrogacy_id: values.surrogacyId,
      p_scheduled_time: values.scheduledTime,
      p_duration: values.duration,
      p_location: values.location || null,
      p_notes: values.notes || null,
    })
    if (error || !data) throw new Error(error?.message ?? 'Moment could not be created.')

    revalidatePath(`/surrogacies/${values.surrogacyId}`)
    revalidatePath('/surrogacies')
    return { ok: true, data: { id: data } }
  } catch (error) {
    return actionFailure(error)
  }
}

export async function cancelMomentAction(momentId: string, surrogacyId: string): Promise<ActionResult> {
  try {
    const actor = await requireActiveMember()
    const id = z.string().uuid().parse(momentId)
    const relationshipId = z.string().uuid().parse(surrogacyId)
    const { error } = await rpcClient(actor.supabase).rpc<null>('cancel_moment_for_trial', {
      p_moment_id: id,
    })
    if (error) throw new Error(error.message)

    revalidatePath(`/surrogacies/${relationshipId}`)
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}

export async function completeMomentAction(
  momentId: string,
  surrogacyId: string,
  status: 'completed' | 'partial' | 'disputed' = 'completed',
): Promise<ActionResult<{ exchangeId: string }>> {
  try {
    const actor = await requireActiveMember()
    const id = z.string().uuid().parse(momentId)
    const relationshipId = z.string().uuid().parse(surrogacyId)
    const exchangeStatus = z.enum(['completed', 'partial', 'disputed']).parse(status)
    const { data, error } = await rpcClient(actor.supabase).rpc<string>('complete_moment_for_trial', {
      p_moment_id: id,
      p_exchange_status: exchangeStatus,
    })
    if (error || !data) throw new Error(error?.message ?? 'Exchange could not be recorded.')

    revalidatePath(`/surrogacies/${relationshipId}`)
    revalidatePath('/rewards')
    return { ok: true, data: { exchangeId: data } }
  } catch (error) {
    return actionFailure(error)
  }
}

export async function submitFeedbackAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireActiveMember()
    const values = feedbackSchema.parse(input)
    const ratings = [values.reliability, values.communication, values.boundaryRespect, values.consideration, values.followThrough]
    const rating = Math.round(ratings.reduce((sum, value) => sum + value, 0) / ratings.length)
    const { data, error } = await rpcClient(actor.supabase).rpc<string>('submit_feedback_for_trial', {
      p_exchange_id: values.exchangeId,
      p_to_user_id: values.toUserId,
      p_rating: rating,
      p_breakdown: {
        reliability: values.reliability,
        communication: values.communication,
        boundaryRespect: values.boundaryRespect,
        consideration: values.consideration,
        followThrough: values.followThrough,
      },
      p_comments: values.comments || null,
      p_skill_endorsements: values.skillEndorsements,
    })
    if (error || !data) throw new Error(error?.message ?? 'Feedback could not be submitted.')

    revalidatePath('/surrogacies')
    revalidatePath('/rewards')
    revalidatePath('/discover')
    return { ok: true, data: { id: data } }
  } catch (error) {
    return actionFailure(error)
  }
}
