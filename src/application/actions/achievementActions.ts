'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/application/actions/adminContext'
import { actionFailure, requireActiveMember, type ActionResult } from '@/application/actions/memberContext'

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

const reviewReason = z.string().trim().min(20).max(2000)

const reviewRequestSchema = z.object({
  feedbackId: z.string().uuid(),
  reason: reviewReason,
}).strict()

const reviewDecisionSchema = z.object({
  reportId: z.string().uuid(),
  decision: z.enum(['invalidate', 'dismiss']),
  reason: reviewReason,
}).strict()

const reviewAppealSchema = z.object({
  reportId: z.string().uuid(),
  reason: reviewReason,
}).strict()

const appealDecisionSchema = z.object({
  appealId: z.string().uuid(),
  decision: z.enum(['accept', 'deny']),
  reason: reviewReason,
}).strict()

/** A receiving Feedback participant requests review of a specific reward. */
export async function requestRewardReviewAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const member = await requireActiveMember()
    const values = reviewRequestSchema.parse(input)
    const { data, error } = await member.supabase.rpc('open_reward_feedback_review', {
      p_feedback_id: values.feedbackId,
      p_reason: values.reason,
    })
    if (error || !data) throw new Error(error?.message ?? 'Unable to open reward review.')

    revalidatePath('/admin/reports')
    revalidatePath('/surrogacies')
    revalidatePath('/rewards')
    return { ok: true, data: { id: data } }
  } catch (error) {
    return actionFailure(error)
  }
}

/** A specifically authorized administrator changes an evidence-backed reward. */
export async function adjudicateRewardReviewAction(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    const values = reviewDecisionSchema.parse(input)
    const { error } = await admin.supabase.rpc('adjudicate_reward_review', {
      p_report_id: values.reportId,
      p_decision: values.decision,
      p_reason: values.reason,
    })
    if (error) throw new Error(error.message)

    revalidatePath('/admin/reports')
    revalidatePath('/admin/achievements')
    revalidatePath('/rewards')
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}

/** Participants may request an independent review within 30 days. */
export async function submitRewardReviewAppealAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const member = await requireActiveMember()
    const values = reviewAppealSchema.parse(input)
    const { data, error } = await member.supabase.rpc('submit_reward_review_appeal', {
      p_report_id: values.reportId,
      p_reason: values.reason,
    })
    if (error || !data) throw new Error(error?.message ?? 'Unable to submit the appeal.')

    revalidatePath('/admin/reports')
    revalidatePath('/rewards')
    return { ok: true, data: { id: data } }
  } catch (error) {
    return actionFailure(error)
  }
}

/** The original case adjudicator cannot decide an appeal. */
export async function reviewRewardReviewAppealAction(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    const values = appealDecisionSchema.parse(input)
    const { error } = await admin.supabase.rpc('review_reward_review_appeal', {
      p_appeal_id: values.appealId,
      p_decision: values.decision,
      p_reason: values.reason,
    })
    if (error) throw new Error(error.message)

    revalidatePath('/admin/reports')
    revalidatePath('/rewards')
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}
