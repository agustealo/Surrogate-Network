import { NextResponse } from 'next/server'

import { getReleaseRevision } from '@/infrastructure/operations/releaseMetadata'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  return NextResponse.json(
    {
      status: 'alive',
      revision: getReleaseRevision(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  )
}
