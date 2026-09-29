import { readFileSync } from 'node:fs'
import path from 'node:path'

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('FYP experiment governance wiring', () => {
  it('keeps privileged aggregate access isolated to the guardrail and policy services', () => {
    const guardrails = source('src/application/services/FypExperimentGuardrailService.ts')
    const policy = source('src/application/services/FypExperimentPolicyService.ts')
    const experiment = source('src/application/services/FypExperimentService.ts')

    expect(guardrails).toContain('createServiceClient()')
    expect(policy).toContain('appendSystemRollback')
    expect(policy).toContain('createServiceClient()')
    expect(experiment).not.toContain('createServiceClient')
  })

  it('persists automatic kill-switch policy when live guardrails order rollback', () => {
    const guardrails = source('src/application/services/FypExperimentGuardrailService.ts')

    expect(guardrails).toContain("report.decision.action !== 'rollback'")
    expect(guardrails).toContain('latestPolicy.policyEventId !== policy.policyEventId')
    expect(guardrails).toContain('appendSystemRollback')
    expect(guardrails).toContain('killSwitch: true')
    expect(guardrails).toContain('auto_guardrail_rollback:')
  })

  it('feeds candidate exposure, relationship outcomes, and safety incidents into reevaluation', () => {
    const experiment = source('src/application/services/FypExperimentService.ts')
    const events = source('src/application/services/RecommendationEventService.ts')
    const safety = source('src/application/actions/safetyActions.ts')

    expect(experiment).toContain("input.assignment.cohort === 'candidate'")
    expect(experiment).toContain('evaluateAndRollback()')
    expect(events).toContain("safetyIncident: 'fyp.safety_incident'")
    expect(events).toContain('resolveSafetyExposureForMember')
    expect(events).toContain('recordSafetyIncidentFromExposure')
    expect(events).toContain('hasExperimentProvenance')
    expect(events).toContain('evaluateAndRollback()')
    expect(safety).toContain("incidentType: 'block'")
    expect(safety).toContain("incidentType: 'report'")
  })

  it('captures block provenance before block RLS hides the target marketplace records', () => {
    const safety = source('src/application/actions/safetyActions.ts')
    const resolveIndex = safety.indexOf('const exposure = await resolveFypSafetyExposure({')
    const blockIndex = safety.indexOf("supabase.from('blocks').upsert(")
    const recordIndex = safety.indexOf('await recordFypSafetySignal({')

    expect(resolveIndex).toBeGreaterThan(-1)
    expect(blockIndex).toBeGreaterThan(resolveIndex)
    expect(recordIndex).toBeGreaterThan(blockIndex)
  })

  it('surfaces current live guardrail state in the admin control plane', () => {
    const adminPage = source('src/app/admin/fyp/page.tsx')

    expect(adminPage).toContain('FypExperimentGuardrailService')
    expect(adminPage).toContain('Live guardrails')
    expect(adminPage).toContain('Candidate safety incident rate')
    expect(adminPage).toContain('Rollback is persisted automatically')
  })
})
