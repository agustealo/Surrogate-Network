'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { moderateReportAction } from '@/application/actions/moderationActions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

type ModerationStatus = 'investigating' | 'resolved' | 'dismissed'

export function ReportModerationControls({
  reportId,
  currentStatus,
}: {
  reportId: string
  currentStatus: 'pending' | 'investigating' | 'resolved' | 'dismissed'
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [status, setStatus] = useState<ModerationStatus>(currentStatus === 'pending' ? 'investigating' : currentStatus)
  const [actionTaken, setActionTaken] = useState('')
  const [suspendReportedUser, setSuspendReportedUser] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError(null)
    const result = await moderateReportAction({ reportId, status, actionTaken, suspendReportedUser })
    setBusy(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    toast({ title: 'Report updated', description: `Moderation state is now ${status}.` })
    setActionTaken('')
    setSuspendReportedUser(false)
    router.refresh()
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          <span>Moderation state</span>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as ModerationStatus)}
          >
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </label>
        <label className="flex items-center gap-2 self-end rounded-md border px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={suspendReportedUser}
            onChange={(event) => setSuspendReportedUser(event.target.checked)}
          />
          Suspend reported member
        </label>
      </div>
      <Textarea
        value={actionTaken}
        onChange={(event) => setActionTaken(event.target.value)}
        placeholder="Investigation notes or final moderation outcome"
        maxLength={2000}
      />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button onClick={submit} disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {busy ? 'Saving...' : 'Apply moderation'}
      </Button>
    </div>
  )
}
