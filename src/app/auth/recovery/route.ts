import { NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/supabase/server'
import { RECOVERY_COOKIE, RECOVERY_COOKIE_MAX_AGE_SECONDS } from '@/lib/authRecovery'
import { routes } from '@/lib/routes'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const flowId = requestUrl.searchParams.get('sb_flow_id')

  if (!code) return NextResponse.redirect(new URL(routes.public.forgotPassword, requestUrl.origin))

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined,
  )
  if (error) return NextResponse.redirect(new URL(routes.public.forgotPassword, requestUrl.origin))

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.redirect(new URL(routes.public.forgotPassword, requestUrl.origin))

  const response = NextResponse.redirect(new URL(routes.public.resetPassword, requestUrl.origin))
  response.cookies.set(RECOVERY_COOKIE, '1', {
    httpOnly: true,
    secure: requestUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: RECOVERY_COOKIE_MAX_AGE_SECONDS,
  })
  return response
}
