'use client'

import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { deleteAccountAction } from '@/application/actions/accountLifecycleActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { routes } from '@/lib/routes'

export function AccountDeletionControls() {
  const [confirming, setConfirming] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function removeAccount() {
    setBusy(true)
    setError(null)
    const result = await deleteAccountAction({
      currentPassword: password,
      confirmation,
    })

    if (!result.ok) {
      setBusy(false)
      setError(result.error)
      return
    }

    const suffix = result.data.authRemoved ? '' : '?auth=pending'
    // Terminal deletion invalidates the authenticated app tree. Use a full
    // document navigation instead of refreshing the stale member router state.
    window.location.replace(`${routes.public.accountDeleted}${suffix}`)
  }

  if (!confirming) {
    return (
      <Button variant="destructive" onClick={() => setConfirming(true)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete account
      </Button>
    )
  }

  return (
    <div className="space-y-4 rounded-md border border-destructive/50 p-4">
      <div className="space-y-1">
        <p className="font-medium text-destructive">Permanent account deletion</p>
        <p className="text-sm text-muted-foreground">
          Your member access will be terminated and direct profile/listing content will be redacted. Shared relationship, safety, moderation, and audit records may remain in tombstoned form so another member&apos;s history and platform evidence are not destroyed.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="delete-current-password">Current password</Label>
        <Input
          id="delete-current-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={busy}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="delete-confirmation">Type DELETE to confirm</Label>
        <Input
          id="delete-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          disabled={busy}
        />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="destructive"
          onClick={removeAccount}
          disabled={busy || !password || confirmation !== 'DELETE'}
        >
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {busy ? 'Deleting account...' : 'Permanently delete account'}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setConfirming(false)
            setPassword('')
            setConfirmation('')
            setError(null)
          }}
          disabled={busy}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
