'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { actionFailure, type ActionResult } from '@/application/actions/memberContext'
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
