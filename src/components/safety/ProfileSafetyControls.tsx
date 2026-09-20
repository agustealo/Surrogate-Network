'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flag, Loader2, ShieldBan } from 'lucide-react'
import { blockMemberAction, reportMemberAction } from '@/application/actions/safetyActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

type ProfileSafetyControlsProps = {
  targetUserId: string
  targetName: string
}

export function ProfileSafetyControls({ targetUserId, targetName }: ProfileSafetyControlsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [reportOpen, setReportOpen] = useState(false)
  const [type, setType] = useState<'harassment' | 'inappropriate_content' | 'boundary_violation' | 'spam' | 'impersonation' | 'other'>('other')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState<'block' | 'report' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function block() {
    setBusy('block')
    setError(null)
    const result = await blockMemberAction(targetUserId)
    setBusy(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    toast({ title: `${targetName} blocked`, description: 'New discovery and pairing interactions between these accounts are now blocked.' })
    router.push('/settings/blocked')
    router.refresh()
  }

  async function report() {
    setBusy('report')
    setError(null)
    const result = await reportMemberAction({ reportedUserId: targetUserId, type, severity, description })
    setBusy(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    toast({ title: 'Report submitted', description: 'The report is recorded for administrative review.' })
    setReportOpen(false)
    setDescription('')
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Safety controls</CardTitle><CardDescription>Blocking affects future discovery and pairing. Reporting creates a moderation record.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setReportOpen((open) => !open)} disabled={busy !== null}><Flag className="mr-2 h-4 w-4" />Report</Button>
          <Button variant="destructive" onClick={block} disabled={busy !== null}>{busy === 'block' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldBan className="mr-2 h-4 w-4" />}Block member</Button>
        </div>
        {reportOpen && (
          <div className="space-y-3 rounded-md border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2"><label className="text-sm font-medium">Reason</label><Select value={type} onValueChange={(value) => setType(value as typeof type)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="harassment">Harassment</SelectItem><SelectItem value="inappropriate_content">Inappropriate content</SelectItem><SelectItem value="boundary_violation">Boundary violation</SelectItem><SelectItem value="spam">Spam</SelectItem><SelectItem value="impersonation">Impersonation</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><label className="text-sm font-medium">Severity</label><Select value={severity} onValueChange={(value) => setSeverity(value as typeof severity)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
            </div>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe what happened and include relevant context." maxLength={4000} className="min-h-28" />
            <Button onClick={report} disabled={busy !== null || description.trim().length < 10}>{busy === 'report' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit report</Button>
          </div>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
