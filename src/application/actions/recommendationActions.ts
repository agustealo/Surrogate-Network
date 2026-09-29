'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { actionFailure, requireActiveMember, type ActionResult } from '@/application/actions/memberContext'
import { FypExperimentService } from '@/application/services/FypExperimentService'
import {
  FYP_EVENT_ACTIONS,
  RecommendationEventService,
} from '@/application/services/RecommendationEventService'

const subjectType = z.enum(['need', 'offer'])
const impressionSchema = z.object({
  sessionId: z.string().trim().min(1).max(160),
  items: z.array(z.object({
    subjectType,
    subjectId: z.string().uuid(),
    rankingVersion: z.string().trim().min(1).max(80),
    rankPosition: z.number().int().min(0).max(200),
    score: z.number().min(0).max(100),
  })).max(48),
})

const preferenceSchema = z.object({
  subjectType,
  subjectId: z.string().uuid(),
  preference: z.enum(['save', 'unsave', 'not_interested']),
})

const openSchema = z.object({
  subjectType,
  subjectId: z.string().uuid(),
  sessionId: z.string().trim().min(1).max(160).optional(),
  rankingVersion: z.string().trim().min(1).max(80).optional(),
  rankPosition: z.number().int().min(0).max(200).optional(),
  score: z.number().min(0).max(100).optional(),
})

export async function recordRecommendationImpressionsAction(input: unknown): Promise<ActionResult> {
  try {
    const actor = await requireActiveMember()
    const values = impressionSchema.parse(input)
    const eventService = new RecommendationEventService()
    await eventService.recordImpressions(actor.id, values.sessionId, values.items)

    const experimentService = new FypExperimentService()
    const assignment = await experimentService.assignmentForActor(actor.id)
    await experimentService.recordExposure({
      actorId: actor.id,
      sessionId: values.sessionId,
      assignment,
      items: values.items,
    })

    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}

export async function setRecommendationPreferenceAction(input: unknown): Promise<ActionResult> {
  try {
    const actor = await requireActiveMember()
    const values = preferenceSchema.parse(input)
    const action = values.preference === 'save'
      ? FYP_EVENT_ACTIONS.save
      : values.preference === 'unsave'
        ? FYP_EVENT_ACTIONS.unsave
        : FYP_EVENT_ACTIONS.notInterested

    await new RecommendationEventService().record({
      actorId: actor.id,
      action,
      subjectType: values.subjectType,
      subjectId: values.subjectId,
    })
    revalidatePath('/discover')
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}

export async function recordRecommendationOpenAction(input: unknown): Promise<ActionResult> {
  try {
    const actor = await requireActiveMember()
    const values = openSchema.parse(input)
    await new RecommendationEventService().record({
      actorId: actor.id,
      action: FYP_EVENT_ACTIONS.open,
      subjectType: values.subjectType,
      subjectId: values.subjectId,
      sessionId: values.sessionId,
      rankingVersion: values.rankingVersion,
      rankPosition: values.rankPosition,
      score: values.score,
    })
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}
