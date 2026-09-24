import { NextResponse } from 'next/server'

import { getServerRuntimeConfig } from '@/infrastructure/config/serverRuntimeConfig'
import { probeSupabaseReadiness } from '@/infrastructure/health/readiness'
import { getReleaseRevision } from '@/infrastructure/operations/releaseMetadata'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const revision = getReleaseRevision()
  let config

  try {
    config = getServerRuntimeConfig()
  } catch {
    return NextResponse.json(
      {
        status: 'not_ready',
        revision,
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
      revision,
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
