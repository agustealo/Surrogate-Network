import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportModerationControls } from '@/components/admin/ReportModerationControls'
import { createServiceClient } from '@/infrastructure/supabase/server'

export default async function AdminReportsPage() {
  const service = createServiceClient()
  const { data: reports, error } = await service
    .from('reports')
    .select('id,reported_user_id,reporter_user_id,type,severity,description,status,created_at,resolved_at,action_taken')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(`Unable to load moderation queue: ${error.message}`)

  const userIds = [...new Set((reports ?? []).flatMap((report) => [report.reported_user_id, report.reporter_user_id]))]
  const profilesResult = userIds.length
    ? await service.from('profiles').select('id,name').in('id', userIds)
    : { data: [], error: null }
  if (profilesResult.error) throw new Error(`Unable to load moderation member labels: ${profilesResult.error.message}`)

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
          const reportedName = names.get(report.reported_user_id) ?? 'Unavailable member'
          const reporterName = names.get(report.reporter_user_id) ?? 'Unavailable member'
          return (
            <Card key={report.id}>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge>{report.status}</Badge>
                  <Badge variant="outline">{report.severity}</Badge>
                  <Badge variant="secondary">{report.type.replaceAll('_', ' ')}</Badge>
                </div>
                <CardTitle className="text-xl">Report concerning {reportedName}</CardTitle>
                <CardDescription>
                  Submitted by {reporterName} on {new Date(report.created_at).toLocaleString()}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">{report.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline"><Link href={`/profile/${report.reported_user_id}`}>Reported member profile</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link href={`/profile/${report.reporter_user_id}`}>Reporter profile</Link></Button>
                </div>
                {report.action_taken && (
                  <div className="rounded-md border p-3 text-sm"><span className="font-medium">Recorded outcome:</span> {report.action_taken}</div>
                )}
                <ReportModerationControls reportId={report.id} currentStatus={report.status} />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
