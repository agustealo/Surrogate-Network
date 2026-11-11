import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportModerationControls } from '@/components/admin/ReportModerationControls'
import { ExchangeCaseDecisionControls, ExchangeCaseAppealReviewControls } from '@/components/admin/ExchangeCaseDecisionControls'
import { RewardReviewDecisionControls, RewardAppealDecisionControls } from '@/components/rewards/RewardReviewControls'
import { requireAdmin } from '@/application/actions/adminContext'
import { createServiceClient } from '@/infrastructure/supabase/server'

function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : 'time unavailable'
}

export default async function AdminReportsPage() {
  await requireAdmin()
  const service = createServiceClient()
  const { data: reports, error } = await service
    .from('reports')
    .select('id,reported_user_id,reporter_user_id,type,severity,description,status,created_at,resolved_at,action_taken,case_origin,exchange_id,reward_feedback_id,adjudication,adjudicated_by')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(`Unable to load moderation queue: ${error.message}`)

  const userIds = [...new Set((reports ?? []).flatMap((report) => [report.reported_user_id, report.reporter_user_id]))]
  const profilesResult = userIds.length
    ? await service.from('profiles').select('id,name').in('id', userIds)
    : { data: [], error: null }
  if (profilesResult.error) throw new Error(`Unable to load moderation member labels: ${profilesResult.error.message}`)

  const caseIds = (reports ?? []).filter((report) => report.case_origin !== 'member_report').map((report) => report.id)
  const appealsResult = caseIds.length
    ? await service.from('report_appeals')
      .select('id,report_id,appellant_user_id,reason,status,decision_reason,reviewed_at')
      .in('report_id', caseIds)
      .order('created_at', { ascending: true })
    : { data: [], error: null }
  if (appealsResult.error) throw new Error('Unable to load Exchange case appeals.')
  type AppealRow = NonNullable<typeof appealsResult.data>[number]
  const appealByCase = new Map<string, AppealRow[]>()
  for (const appeal of appealsResult.data ?? []) {
    const current = appealByCase.get(appeal.report_id) ?? []
    current.push(appeal)
    appealByCase.set(appeal.report_id, current)
  }

  const names = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.name]))
  const openCount = (reports ?? []).filter((report) => report.status === 'pending' || report.status === 'investigating').length

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Moderation Reports</h1>
          <p className="text-muted-foreground">{openCount} open report{openCount === 1 ? '' : 's'}. Changes are applied through the atomic moderation authority.</p>
        </div>
        <Button asChild variant="outline"><Link href="/admin">Back to Admin</Link></Button>
      </div>

      {!reports?.length && (
        <Card><CardHeader><CardTitle>No reports</CardTitle><CardDescription>No member reports have been submitted.</CardDescription></CardHeader></Card>
      )}

      <div className="space-y-4">
        {(reports ?? []).map((report) => {
          const status = report.status
          if (!status) throw new Error(`Moderation report ${report.id} has no lifecycle status.`)
          const reportedName = names.get(report.reported_user_id) ?? 'Unavailable member'
          const reporterName = names.get(report.reporter_user_id) ?? 'Unavailable member'
          return (
            <Card key={report.id}>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge>{status}</Badge>
                  <Badge variant="outline">{report.severity}</Badge>
                  <Badge variant="secondary">{report.case_origin === 'exchange_dispute' ? 'Exchange dispute' : report.case_origin === 'reward_review' ? 'Reward review' : report.type.replace(/_/g, ' ')}</Badge>
                </div>
                <CardTitle className="text-xl">{report.case_origin === 'exchange_dispute' ? 'Disputed Exchange case' : report.case_origin === 'reward_review' ? 'Feedback reward eligibility review' : 'Report concerning ' + reportedName}</CardTitle>
                <CardDescription>
                  Submitted by {reporterName} on {formatDateTime(report.created_at)}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">{report.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline"><Link href={`/profile/${report.reported_user_id}`}>Reported member profile</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link href={`/profile/${report.reporter_user_id}`}>Reporter profile</Link></Button>
                </div>
                {report.exchange_id && (
                  <div className="rounded-md border p-3 text-sm">
                    <p className="font-medium">Exchange: {report.exchange_id}</p>
                    <p className="text-muted-foreground">The Exchange remains disputed regardless of case disposition. Neither decision creates two-party confirmation or rewards.</p>
                  </div>
                )}
                {report.reward_feedback_id && (
                  <div className="rounded-md border p-3 text-sm">
                    <p className="font-medium">Linked Feedback: {report.reward_feedback_id}</p>
                    <p className="text-muted-foreground">Evidence review may revoke or restore an existing 10-XP credit. Feedback and original journal history remain unchanged. Neither a bad rating nor an unconnected dispute is sufficient evidence.</p>
                  </div>
                )}
                {report.action_taken && (
                  <div className="rounded-md border p-3 text-sm"><span className="font-medium">Recorded outcome:</span> {report.action_taken}</div>
                )}
                {report.case_origin === 'exchange_dispute' ? (
                  <div className="space-y-4">
                    {report.adjudication && <p className="text-sm">Previous determination: <strong>{report.adjudication}</strong></p>}
                    {(status === 'pending' || status === 'investigating') && (
                      <ExchangeCaseDecisionControls reportId={report.id} />
                    )}
                    {(appealByCase.get(report.id) ?? []).map((appeal) => (
                      <div key={appeal.id} className="space-y-3 rounded-md border p-4">
                        <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">Appeal: {appeal.status}</Badge><span className="text-xs text-muted-foreground">Member {appeal.appellant_user_id}</span></div>
                        <p className="whitespace-pre-wrap text-sm">{appeal.reason}</p>
                        {appeal.decision_reason && <p className="text-sm text-muted-foreground">Review rationale: {appeal.decision_reason}</p>}
                        {appeal.status === 'pending' && <ExchangeCaseAppealReviewControls appealId={appeal.id} />}
                      </div>
                    ))}
                  </div>
                ) : report.case_origin === 'reward_review' ? (
                  <div className="space-y-4">
                    {report.adjudication && <p className="text-sm">Previous determination: <strong>{report.adjudication}</strong></p>}
                    {(status === 'pending' || status === 'investigating') && (
                      <RewardReviewDecisionControls reportId={report.id} />
                    )}
                    {(appealByCase.get(report.id) ?? []).map((appeal) => (
                      <div key={appeal.id} className="space-y-3 rounded-md border p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">Appeal: {appeal.status}</Badge>
                          <span className="text-xs text-muted-foreground">Member {appeal.appellant_user_id}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{appeal.reason}</p>
                        {appeal.decision_reason && <p className="text-sm text-muted-foreground">Review rationale: {appeal.decision_reason}</p>}
                        {appeal.status === 'pending' && (
                          <RewardAppealDecisionControls appealId={appeal.id} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : <ReportModerationControls reportId={report.id} currentStatus={status} />}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
