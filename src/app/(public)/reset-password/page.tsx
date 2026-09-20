import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ResetPasswordForm } from '@/components/account/ResetPasswordForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/infrastructure/supabase/server'
import { RECOVERY_COOKIE } from '@/lib/authRecovery'
import { routes } from '@/lib/routes'

export default async function ResetPasswordPage() {
  const cookieStore = await cookies()
  if (cookieStore.get(RECOVERY_COOKIE)?.value !== '1') redirect(routes.public.forgotPassword)

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect(routes.public.forgotPassword)

  return (
    <main className="container mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Choose a new password</CardTitle>
          <CardDescription>Your recovery link has been verified. Use at least eight characters.</CardDescription>
        </CardHeader>
        <CardContent><ResetPasswordForm /></CardContent>
      </Card>
    </main>
  )
}
