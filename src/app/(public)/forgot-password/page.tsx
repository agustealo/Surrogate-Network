'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/infrastructure/supabase/browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { routes } from '@/lib/routes'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setStatus(null)
    const supabase = createClient()
    const redirectTo = `${window.location.origin}${routes.public.authRecovery}`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setPending(false)
    setStatus(error ? error.message : 'If an account exists for that email, a password reset link has been sent.')
  }

  return (
    <main className="container mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Enter the email address associated with your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            {status && <p role="status" className="text-sm text-muted-foreground">{status}</p>}
            <Button className="w-full" disabled={pending}>{pending ? 'Sending...' : 'Send reset link'}</Button>
            <p className="text-center text-sm"><Link href={routes.public.login} className="text-primary hover:underline">Back to sign in</Link></p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
