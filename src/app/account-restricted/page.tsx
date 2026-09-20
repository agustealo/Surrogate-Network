import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { RestrictedAccountActions } from '@/components/account/RestrictedAccountActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/infrastructure/supabase/server'

export default async function AccountRestrictedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_suspended').eq('id', user.id).maybeSingle()
  if (profile && !profile.is_suspended) redirect('/home')

  return (
    <main className="container mx-auto flex min-h-screen max-w-2xl items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10"><ShieldAlert className="h-6 w-6 text-destructive" /></div>
          <CardTitle>Account access restricted</CardTitle>
          <CardDescription>Your account is currently restricted from member operations. Existing authentication remains available so you can see this status and sign out safely.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Core marketplace, proposal, relationship, scheduling, feedback, and ledger operations are also blocked at the database boundary while the restriction is active.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary"><Link href="/safety">Review safety guidance</Link></Button>
            <RestrictedAccountActions />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
