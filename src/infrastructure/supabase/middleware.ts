import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { REQUEST_ID_HEADER, resolveRequestId } from '@/infrastructure/observability/requestCorrelation'

export async function updateSession(request: NextRequest) {
  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER))
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(REQUEST_ID_HEADER, requestId)

  const createResponse = () => {
    const nextResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    nextResponse.headers.set(REQUEST_ID_HEADER, requestId)
    return nextResponse
  }

  let response = createResponse()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = createResponse()
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = createResponse()
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const protectedMemberRoutes = ['/home', '/discover', '/needs', '/offers', '/proposals', '/surrogacies', '/messages', '/rewards', '/profile', '/settings', '/feedback']
  const isMemberRoute = protectedMemberRoutes.some((route) =>
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  )

  if ((isMemberRoute || request.nextUrl.pathname.startsWith('/admin')) && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    const redirectResponse = NextResponse.redirect(loginUrl)
    redirectResponse.headers.set(REQUEST_ID_HEADER, requestId)
    return redirectResponse
  }

  return response
}
