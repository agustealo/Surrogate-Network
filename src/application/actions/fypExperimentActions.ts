'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/application/actions/adminContext'
import { FypExperimentPolicyService } from '@/application/services/FypExperimentPolicyService'
import { ShadowRankingEvaluationService } from '@/application/services/ShadowRankingEvaluationService'

const schema = z.object({
  mode: z.enum(['enable', 'disable', 'kill', 'resume']),
  requestedTrafficPercent: z.coerce.number().min(0).max(5).default(5),
  reason: z.string().trim().min(3).max(240),
})

export async function updateFypExperimentPolicyAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const values = schema.parse({
    mode: formData.get('mode'),
    requestedTrafficPercent: formData.get('requestedTrafficPercent') ?? 5,
    reason: formData.get('reason'),
  })

  const report = await new ShadowRankingEvaluationService().evaluateGlobal()
  if ((values.mode === 'enable' || values.mode === 'resume') && !report.graduation.eligibleForLimitedExperiment) {
    throw new Error(`Shadow graduation is not authorized: ${report.graduation.reasons.join(', ')}`)
  }

  const current = await new FypExperimentPolicyService().currentPolicy()
  const enabled = values.mode === 'enable' || values.mode === 'resume'
    ? true
    : values.mode === 'disable'
      ? false
      : current.enabled
  const killSwitch = values.mode === 'kill'
    ? true
    : values.mode === 'resume' || values.mode === 'enable'
      ? false
      : current.killSwitch

  await new FypExperimentPolicyService().appendPolicy({
    adminId: admin.id,
    enabled,
    killSwitch,
    requestedTrafficPercent: enabled ? values.requestedTrafficPercent : 0,
    graduation: report.graduation,
    reason: values.reason,
  })

  revalidatePath('/admin/fyp')
  revalidatePath('/discover')
}
