'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { setTrialParticipationAction } from '@/application/actions/accountLifecycleActions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function AccountParticipationControls({ mode }: { mode: 'deactivate' | 'reactivate' }) {
  const router = useRouter()
  const { toast } = useToast()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function apply() {
    setBusy(true)
    setError(null)
    const active = mode === 'reactivate'
    const result = await setTrialParticipationAction(active)
    setBusy(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    if (active) {
      toast({ title: 'Trial account reactivated' })
      router.replace('/home')
    } else {
      router.replace('/account-deactivated')
    }
    router.refresh()
  }

  if (mode === 'reactivate') {
    return (
      <div className="space-y-3">
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button onClick={apply} disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {busy ? 'Reactivating...' : 'Reactivate Consumer Trial Account'}
        </Button>
      </div>
    )
  }

  if (!confirming) {
    return <Button variant="destructive" onClick={() => setConfirming(true)}>Deactivate Consumer Trial Account</Button>
  }

  return (
    <div className="space-y-3 rounded-md border border-destructive/40 p-4">
      <p className="text-sm">
        Deactivation stops member operations and removes you from active trial participation. It does not erase safety, audit, relationship, or other records that must remain consistent for the trial.
      </p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="destructive" onClick={apply} disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {busy ? 'Deactivating...' : 'Confirm Deactivation'}
        </Button>
        <Button variant="outline" onClick={() => setConfirming(false)} disabled={busy}>Cancel</Button>
      </div>
    </div>
  )
}
