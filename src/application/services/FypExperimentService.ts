import 'server-only'

import {
  assignFypExperimentCohort,
  type FypExperimentAssignment,
  type FypExperimentPolicy,
} from '@/domain/recommendations/experiment'
import { FypExperimentPolicyService } from '@/application/services/FypExperimentPolicyService'
import {
  RecommendationEventService,
  type RecommendationSubjectType,
} from '@/application/services/RecommendationEventService'

export type FypExperimentExposure = {
  subjectType: RecommendationSubjectType
  subjectId: string
  rankingVersion: string
  rankPosition: number
  score: number
}

export class FypExperimentService {
  assignmentFor(actorId: string, policy: FypExperimentPolicy): FypExperimentAssignment {
    return assignFypExperimentCohort({ actorId, policy })
  }

  async assignmentForActor(actorId: string): Promise<FypExperimentAssignment> {
    const policy = await new FypExperimentPolicyService().currentPolicy()
    return this.assignmentFor(actorId, policy)
  }

  async recordExposure(input: {
    actorId: string
    sessionId: string
    assignment: FypExperimentAssignment
    items: FypExperimentExposure[]
  }): Promise<void> {
    if (!input.assignment.candidateAuthorized || !input.items.length) return

    const eventService = new RecommendationEventService()
    await eventService.recordExperimentImpressions(
      input.actorId,
      `${input.sessionId}:${input.assignment.experimentVersion}:${input.assignment.cohort}`,
      input.items.map((item) => ({
        ...item,
        metadata: {
          experimentVersion: input.assignment.experimentVersion,
          experimentCohort: input.assignment.cohort,
          experimentBucket: input.assignment.bucket,
          authorizedTrafficPercent: input.assignment.authorizedTrafficPercent,
          excludedFromShadowEvaluation: true,
        },
      })),
    )
  }
}
