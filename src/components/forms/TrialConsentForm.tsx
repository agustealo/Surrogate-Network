'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { acceptTrialPolicyAction } from '@/application/actions/trialPolicyActions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { TRIAL_MINIMUM_AGE } from '@/lib/trialPolicy'

export function TrialConsentForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!confirmed) {
      setError(`Confirm that you are at least ${TRIAL_MINIMUM_AGE} and accept the current trial policies.`)
      return
    }

    setBusy(true)
    setError(null)
    const result = await acceptTrialPolicyAction({ confirmed: true })
    setBusy(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    toast({ title: 'Trial consent recorded' })
    router.replace('/home')
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <label className="flex items-start gap-3 rounded-md border p-4 text-sm">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        <span>
          I confirm I am at least {TRIAL_MINIMUM_AGE} and agree to the <Link className="underline" href="/terms" target="_blank">Consumer Trial Terms</Link> and <Link className="underline" href="/privacy" target="_blank">Privacy Notice</Link>.
        </span>
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button onClick={submit} disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {busy ? 'Recording...' : 'Enter Consumer Trial'}
      </Button>
    </div>
  )
}
