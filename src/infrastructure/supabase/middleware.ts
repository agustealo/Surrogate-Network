import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { getPublicRuntimeConfig } from '@/infrastructure/config/runtimeConfig'
import { REQUEST_ID_HEADER, resolveRequestId } from '@/infrastructure/observability/requestCorrelation'

const HEALTH_PROBE_PATHS = new Set(['/api/health/live', '/api/health/ready'])

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

  if (HEALTH_PROBE_PATHS.has(request.nextUrl.pathname)) {
    return createResponse()
  }

  let response = createResponse()
  const config = getPublicRuntimeConfig()

  const supabase = createServerClient(
    config.supabaseUrl,
    config.supabaseAnonKey,
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
