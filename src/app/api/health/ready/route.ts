import { NextResponse } from 'next/server'

import { getPublicRuntimeConfig } from '@/infrastructure/config/runtimeConfig'
import { probeSupabaseReadiness } from '@/infrastructure/health/readiness'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  let config

  try {
    config = getPublicRuntimeConfig()
  } catch {
    return NextResponse.json(
      {
        status: 'not_ready',
        checks: {
          runtimeConfig: 'failed',
          supabase: 'not_checked',
        },
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  }

  const supabase = await probeSupabaseReadiness(config)
  const ready = supabase.ok

  return NextResponse.json(
    {
      status: ready ? 'ready' : 'not_ready',
      checks: {
        runtimeConfig: 'ok',
        supabase: ready ? 'ok' : 'failed',
      },
    },
    {
      status: ready ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  )
}
