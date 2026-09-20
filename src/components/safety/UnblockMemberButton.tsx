'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { unblockMemberAction } from '@/application/actions/safetyActions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function UnblockMemberButton({ userId, name }: { userId: string; name: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function unblock() {
    setBusy(true)
    setError(null)
    const result = await unblockMemberAction(userId)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    toast({ title: `${name} unblocked` })
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <Button size="sm" variant="outline" onClick={unblock} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{busy ? 'Unblocking...' : 'Unblock'}</Button>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
