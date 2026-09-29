import { updateFypExperimentPolicyAction } from '@/application/actions/fypExperimentActions'
import { FypExperimentGuardrailService } from '@/application/services/FypExperimentGuardrailService'
import { FypExperimentPolicyService } from '@/application/services/FypExperimentPolicyService'
import { ShadowRankingEvaluationService } from '@/application/services/ShadowRankingEvaluationService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function FypExperimentAdminPage() {
  const [policy, report, guardrails] = await Promise.all([
    new FypExperimentPolicyService().currentPolicy(),
    new ShadowRankingEvaluationService().evaluateGlobal(),
    new FypExperimentGuardrailService().evaluateLive(),
  ])

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold">FYP Experiment Control</h1>
        <p className="text-muted-foreground">Governed activation for the shadow candidate ranker. Consumer traffic remains baseline unless shadow graduation and cohort policy both authorize candidate delivery.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Current policy</CardTitle>
            <CardDescription>Append-only policy authority from canonical audit history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-2">
              <Badge variant={policy.enabled ? 'default' : 'secondary'}>{policy.enabled ? 'Enabled' : 'Disabled'}</Badge>
              {policy.killSwitch && <Badge variant="destructive">Kill switch active</Badge>}
            </div>
            <p>Authorized request: {policy.requestedTrafficPercent}%</p>
            <p>Last reason: {policy.changeReason}</p>
            <p className="text-muted-foreground">Changed: {policy.changedAt ?? 'Never'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shadow graduation</CardTitle>
            <CardDescription>Computed from platform-wide, non-experiment-contaminated audit evidence.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Badge variant={report.graduation.eligibleForLimitedExperiment ? 'default' : 'secondary'}>
              {report.graduation.eligibleForLimitedExperiment ? 'Eligible' : 'Not eligible'}
            </Badge>
            <p>Evaluated: {report.evaluation.evaluatedCount}</p>
            <p>Outcomes: {report.evaluation.outcomeCount}</p>
            <p>Harmful demotion rate: {(report.evaluation.harmfulDemotionRate * 100).toFixed(2)}%</p>
            <p>Net outcome rank gain: {report.evaluation.netOutcomeRankGain}</p>
            {report.graduation.reasons.length > 0 && (
              <div className="text-muted-foreground">{report.graduation.reasons.join(' · ')}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live guardrails</CardTitle>
            <CardDescription>Current policy-window comparison of control and candidate traffic. Rollback is persisted automatically when a guardrail breaches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Badge variant={guardrails.decision.action === 'rollback' ? 'destructive' : guardrails.decision.action === 'continue' ? 'default' : 'secondary'}>
              {guardrails.decision.action.replace('_', ' ')}
            </Badge>
            <p>Control exposures: {guardrails.input.controlExposureCount}</p>
            <p>Candidate exposures: {guardrails.input.candidateExposureCount}</p>
            <p>Control outcome rate: {(guardrails.decision.controlOutcomeRate * 100).toFixed(2)}%</p>
            <p>Candidate outcome rate: {(guardrails.decision.candidateOutcomeRate * 100).toFixed(2)}%</p>
            <p>Candidate safety incident rate: {(guardrails.decision.candidateSafetyIncidentRate * 100).toFixed(2)}%</p>
            {guardrails.malformedEvidenceCount > 0 && (
              <p className="text-muted-foreground">Ignored malformed evidence: {guardrails.malformedEvidenceCount}</p>
            )}
            {guardrails.decision.reasons.length > 0 && (
              <div className="text-muted-foreground">{guardrails.decision.reasons.join(' · ')}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy action</CardTitle>
          <CardDescription>Enable and resume fail closed unless the current shadow evidence passes graduation. Candidate allocation is capped by domain policy at 5%.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateFypExperimentPolicyAction} className="space-y-4">
            <div className="grid gap-2 md:max-w-xs">
              <Label htmlFor="requestedTrafficPercent">Candidate traffic percent</Label>
              <Input id="requestedTrafficPercent" name="requestedTrafficPercent" type="number" min="0" max="5" step="1" defaultValue={policy.requestedTrafficPercent || 5} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Change reason</Label>
              <Input id="reason" name="reason" required minLength={3} maxLength={240} placeholder="Why this policy change is being made" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button name="mode" value="enable" type="submit">Enable candidate</Button>
              <Button name="mode" value="resume" type="submit" variant="outline">Resume after kill</Button>
              <Button name="mode" value="disable" type="submit" variant="outline">Disable experiment</Button>
              <Button name="mode" value="kill" type="submit" variant="destructive">Trip kill switch</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
