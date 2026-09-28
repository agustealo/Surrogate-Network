import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import { createClient } from '@/infrastructure/supabase/server'
import { routes } from '@/lib/routes'

const ALLOWED_EMAIL_OTP_TYPES = new Set<EmailOtpType>(['email'])

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null

  if (!tokenHash || !type || !ALLOWED_EMAIL_OTP_TYPES.has(type)) {
    return NextResponse.redirect(new URL(`${routes.public.signup}?confirmation=invalid`, requestUrl.origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  })

  if (error) {
    return NextResponse.redirect(new URL(`${routes.public.signup}?confirmation=invalid`, requestUrl.origin))
  }

  return NextResponse.redirect(new URL('/profile/create', requestUrl.origin))
}
