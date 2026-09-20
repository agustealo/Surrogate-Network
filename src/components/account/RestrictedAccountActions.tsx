'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/infrastructure/supabase/browser'

export function RestrictedAccountActions() {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function signOut() {
    setIsSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <Button onClick={signOut} variant="outline" disabled={isSigningOut}>
      {isSigningOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isSigningOut ? 'Signing out...' : 'Sign out'}
    </Button>
  )
}
