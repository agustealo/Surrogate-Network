'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { actionFailure, requireActiveMember, type ActionResult } from '@/application/actions/memberContext'
import { requireAdmin } from '@/application/actions/adminContext'

const moderationSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(['investigating', 'resolved', 'dismissed']),
  actionTaken: z.string().trim().max(2000).optional(),
  suspendReportedUser: z.boolean().default(false),
})

export async function moderateReportAction(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    const values = moderationSchema.parse(input)
    if ((values.status === 'resolved' || values.status === 'dismissed') && !values.actionTaken) {
      throw new Error('Record the moderation outcome before closing a report.')
    }

    const { error } = await admin.supabase.rpc('moderate_report_for_trial', {
      p_report_id: values.reportId,
      p_status: values.status,
      p_action_taken: values.actionTaken,
      p_suspend_reported_user: values.suspendReportedUser,
    })
    if (error) throw new Error(`Unable to moderate report: ${error.message}`)

    revalidatePath('/admin')
    revalidatePath('/admin/reports')
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}

const caseDecisionSchema = z.object({
  reportId: z.string().uuid(),
  decision: z.enum(['uphold', 'dismiss']),
  reason: z.string().trim().min(12).max(2000),
}).strict()

const caseAppealSchema = z.object({
  reportId: z.string().uuid(),
  reason: z.string().trim().min(12).max(2000),
}).strict()

const appealReviewSchema = z.object({
  appealId: z.string().uuid(),
  decision: z.enum(['accept', 'deny']),
  reason: z.string().trim().min(12).max(2000),
}).strict()

/** Independently adjudicate a linked Exchange case; no reward writes. */
export async function adjudicateExchangeCaseAction(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    const values = caseDecisionSchema.parse(input)
    const { error } = await admin.supabase.rpc('adjudicate_exchange_dispute', {
      p_report_id: values.reportId,
      p_decision: values.decision,
      p_reason: values.reason,
    })
    if (error) throw new Error('Unable to adjudicate Exchange case: ' + error.message)

    revalidatePath('/admin/reports')
    revalidatePath('/surrogacies')
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}

/** An actual Exchange participant asks for independent review. */
export async function submitExchangeCaseAppealAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const member = await requireActiveMember()
    const values = caseAppealSchema.parse(input)
    const { data, error } = await member.supabase.rpc('submit_exchange_case_appeal', {
      p_report_id: values.reportId,
      p_reason: values.reason,
    })
    if (error || !data) throw new Error(error?.message ?? 'Unable to file this appeal.')

    revalidatePath('/admin/reports')
    revalidatePath('/surrogacies')
    return { ok: true, data: { id: data } }
  } catch (error) {
    return actionFailure(error)
  }
}

/** A second authorized reviewer may accept an appeal for re-investigation. */
export async function reviewExchangeCaseAppealAction(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    const values = appealReviewSchema.parse(input)
    const { error } = await admin.supabase.rpc('review_exchange_case_appeal', {
      p_appeal_id: values.appealId,
      p_decision: values.decision,
      p_reason: values.reason,
    })
    if (error) throw new Error('Unable to review case appeal: ' + error.message)

    revalidatePath('/admin/reports')
    revalidatePath('/surrogacies')
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}
