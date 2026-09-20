'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { actionFailure, type ActionResult } from '@/application/actions/memberContext'
import { requireAdmin } from '@/application/actions/adminContext'
import { createServiceClient } from '@/infrastructure/supabase/server'

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

    const service = createServiceClient()
    const { data: report, error: reportError } = await service
      .from('reports')
      .select('id,reported_user_id,status,action_taken')
      .eq('id', values.reportId)
      .single()
    if (reportError || !report) throw new Error('The report is unavailable.')

    const resolvedAt = values.status === 'resolved' || values.status === 'dismissed'
      ? new Date().toISOString()
      : null

    const { error: updateError } = await service
      .from('reports')
      .update({
        status: values.status,
        action_taken: values.actionTaken || null,
        resolved_at: resolvedAt,
      })
      .eq('id', values.reportId)
    if (updateError) throw new Error(`Unable to update report: ${updateError.message}`)

    if (values.suspendReportedUser) {
      const reason = values.actionTaken || `Suspended from report ${values.reportId}`
      const { error: suspendError } = await service
        .from('profiles')
        .update({ is_suspended: true })
        .eq('id', report.reported_user_id)
      if (suspendError) throw new Error(`Report updated but suspension failed: ${suspendError.message}`)

      const { data: activeRestriction, error: restrictionReadError } = await service
        .from('restrictions')
        .select('id')
        .eq('user_id', report.reported_user_id)
        .eq('type', 'suspension')
        .eq('active', true)
        .maybeSingle()
      if (restrictionReadError) throw new Error(`Unable to verify suspension record: ${restrictionReadError.message}`)

      if (!activeRestriction) {
        const { error: restrictionError } = await service.from('restrictions').insert({
          user_id: report.reported_user_id,
          type: 'suspension',
          reason,
          active: true,
        })
        if (restrictionError) throw new Error(`Unable to persist suspension record: ${restrictionError.message}`)
      }
    }

    const { error: auditError } = await service.from('audit_events').insert({
      actor_id: admin.id,
      action: 'report_moderated',
      target_id: values.reportId,
      target_type: 'report',
      before: { status: report.status, action_taken: report.action_taken },
      after: {
        status: values.status,
        action_taken: values.actionTaken || null,
        suspended_reported_user: values.suspendReportedUser,
      },
      timestamp: new Date().toISOString(),
    })
    if (auditError) throw new Error(`Moderation succeeded but audit persistence failed: ${auditError.message}`)

    revalidatePath('/admin')
    revalidatePath('/admin/reports')
    revalidatePath(`/profile/${report.reported_user_id}`)
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}
