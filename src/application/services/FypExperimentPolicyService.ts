import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  FYP_LIMITED_EXPERIMENT_VERSION,
  type FypExperimentPolicy,
} from '@/domain/recommendations/experiment'
import {
  FYP_SHADOW_GRADUATION_THRESHOLDS,
  type ShadowGraduationDecision,
} from '@/domain/recommendations/shadowEvaluation'
import type { Database, Json } from '@/infrastructure/supabase/database.types'
import { createClient, createServiceClient } from '@/infrastructure/supabase/server'

export const FYP_EXPERIMENT_POLICY_ACTION = 'fyp.experiment_policy' as const
const POLICY_TARGET_TYPE = 'fyp_experiment'

export type PersistedFypExperimentPolicy = FypExperimentPolicy & {
  policyEventId: string | null
  changedAt: string | null
  changedBy: string | null
  changeReason: string
}

type PolicyWriteInput = {
  enabled: boolean
  killSwitch: boolean
  requestedTrafficPercent: number
  graduation: ShadowGraduationDecision
  reason: string
}

const defaultGraduation = (): ShadowGraduationDecision => ({
  eligibleForLimitedExperiment: false,
  reasons: ['shadow_graduation_not_authorized'],
  thresholds: { ...FYP_SHADOW_GRADUATION_THRESHOLDS },
})

const defaultPolicy = (): PersistedFypExperimentPolicy => ({
  enabled: false,
  killSwitch: false,
  requestedTrafficPercent: 0,
  graduation: defaultGraduation(),
  policyEventId: null,
  changedAt: null,
  changedBy: null,
  changeReason: 'no_persisted_policy',
})

function asRecord(value: Json | null | undefined): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function parseGraduation(value: unknown): ShadowGraduationDecision {
  const record = asRecord(value as Json | null | undefined)
  const thresholds = asRecord(record?.thresholds as Json | null | undefined)
  if (
    typeof record?.eligibleForLimitedExperiment !== 'boolean'
    || !Array.isArray(record.reasons)
    || record.reasons.some((reason) => typeof reason !== 'string')
    || typeof thresholds?.minimumEvaluatedCount !== 'number'
    || typeof thresholds.minimumOutcomeCount !== 'number'
    || typeof thresholds.maximumHarmfulDemotionRate !== 'number'
    || typeof thresholds.minimumNetOutcomeRankGain !== 'number'
  ) return defaultGraduation()

  return {
    eligibleForLimitedExperiment: record.eligibleForLimitedExperiment,
    reasons: record.reasons as string[],
    thresholds: {
      minimumEvaluatedCount: thresholds.minimumEvaluatedCount,
      minimumOutcomeCount: thresholds.minimumOutcomeCount,
      maximumHarmfulDemotionRate: thresholds.maximumHarmfulDemotionRate,
      minimumNetOutcomeRankGain: thresholds.minimumNetOutcomeRankGain,
    },
  }
}

export class FypExperimentPolicyService {
  async currentPolicy(options?: { privileged?: boolean }): Promise<PersistedFypExperimentPolicy> {
    const supabase = options?.privileged ? createServiceClient() : await createClient()
    return this.currentPolicyWithClient(supabase)
  }

  private async currentPolicyWithClient(
    supabase: SupabaseClient<Database>,
  ): Promise<PersistedFypExperimentPolicy> {
    const { data, error } = await supabase
      .from('audit_events')
      .select('id,actor_id,after,reason,timestamp')
      .eq('action', FYP_EXPERIMENT_POLICY_ACTION)
      .eq('target_type', POLICY_TARGET_TYPE)
      .eq('target_id', FYP_LIMITED_EXPERIMENT_VERSION)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(`Failed to read FYP experiment policy: ${error.message}`)
    if (!data) return defaultPolicy()

    const after = asRecord(data.after)
    if (
      typeof after?.enabled !== 'boolean'
      || typeof after.killSwitch !== 'boolean'
      || typeof after.requestedTrafficPercent !== 'number'
    ) return defaultPolicy()

    return {
      enabled: after.enabled,
      killSwitch: after.killSwitch,
      requestedTrafficPercent: after.requestedTrafficPercent,
      graduation: parseGraduation(after.graduation),
      policyEventId: data.id,
      changedAt: data.timestamp,
      changedBy: data.actor_id,
      changeReason: data.reason ?? 'unspecified',
    }
  }

  async appendPolicy(input: PolicyWriteInput & { adminId: string }): Promise<void> {
    const supabase = await createClient()
    await this.appendPolicyWithClient(supabase, input.adminId, input)
  }

  async appendSystemRollback(input: PolicyWriteInput): Promise<void> {
    const supabase = createServiceClient()
    await this.appendPolicyWithClient(supabase, null, input)
  }

  private async appendPolicyWithClient(
    supabase: SupabaseClient<Database>,
    actorId: string | null,
    input: PolicyWriteInput,
  ): Promise<void> {
    const { error } = await supabase.from('audit_events').insert({
      actor_id: actorId,
      action: FYP_EXPERIMENT_POLICY_ACTION,
      target_type: POLICY_TARGET_TYPE,
      target_id: FYP_LIMITED_EXPERIMENT_VERSION,
      reason: input.reason,
      after: {
        enabled: input.enabled,
        killSwitch: input.killSwitch,
        requestedTrafficPercent: input.requestedTrafficPercent,
        graduation: input.graduation,
      } as Json,
    })

    if (error) throw new Error(`Failed to persist FYP experiment policy: ${error.message}`)
  }
}
