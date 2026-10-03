import 'server-only'

import { RecommendationEventService } from '@/application/services/RecommendationEventService'
import { createClient } from '@/infrastructure/supabase/server'
import type { SurrogateCategory } from '@/domain/types'

export type RecommendationPreferenceItem = {
  subjectType: 'need' | 'offer'
  subjectId: string
  title: string | null
  description: string | null
  category: SurrogateCategory | null
  available: boolean
}

export type RecommendationPreferenceView = {
  saved: RecommendationPreferenceItem[]
  hidden: RecommendationPreferenceItem[]
}

type ListingRow = {
  id: string
  title: string
  description: string
  category: SurrogateCategory
  status: string
}

function subjectFromKey(key: string): { subjectType: 'need' | 'offer'; subjectId: string } | null {
  const separator = key.indexOf(':')
  if (separator < 0) return null
  const subjectType = key.slice(0, separator)
  const subjectId = key.slice(separator + 1)
  if ((subjectType !== 'need' && subjectType !== 'offer') || !subjectId) return null
  return { subjectType, subjectId }
}

export class RecommendationPreferenceService {
  async getView(now = new Date()): Promise<RecommendationPreferenceView> {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('You must be signed in to manage recommendation preferences.')

    const history = await new RecommendationEventService().historyFor(user.id, now)
    const subjects = new Map<string, { subjectType: 'need' | 'offer'; subjectId: string }>()

    for (const key of [...history.saved, ...history.notInterested]) {
      const subject = subjectFromKey(key)
      if (subject) subjects.set(key, subject)
    }

    const needIds = [...subjects.values()].filter((item) => item.subjectType === 'need').map((item) => item.subjectId)
    const offerIds = [...subjects.values()].filter((item) => item.subjectType === 'offer').map((item) => item.subjectId)

    const [needsResult, offersResult] = await Promise.all([
      needIds.length
        ? supabase.from('needs').select('id,title,description,category,status').in('id', needIds)
        : Promise.resolve({ data: [] as ListingRow[], error: null }),
      offerIds.length
        ? supabase.from('offers').select('id,title,description,category,status').in('id', offerIds)
        : Promise.resolve({ data: [] as ListingRow[], error: null }),
    ])

    if (needsResult.error) throw new Error(`Failed to load saved or hidden Needs: ${needsResult.error.message}`)
    if (offersResult.error) throw new Error(`Failed to load saved or hidden Offers: ${offersResult.error.message}`)

    const needRows = new Map((needsResult.data ?? []).map((row) => [row.id, row as ListingRow]))
    const offerRows = new Map((offersResult.data ?? []).map((row) => [row.id, row as ListingRow]))

    const materialize = (key: string): RecommendationPreferenceItem | null => {
      const subject = subjects.get(key)
      if (!subject) return null
      const row = subject.subjectType === 'need' ? needRows.get(subject.subjectId) : offerRows.get(subject.subjectId)
      return {
        subjectType: subject.subjectType,
        subjectId: subject.subjectId,
        title: row?.title ?? null,
        description: row?.description ?? null,
        category: row?.category ?? null,
        available: row?.status === 'active',
      }
    }

    return {
      saved: [...history.saved].map(materialize).filter((item): item is RecommendationPreferenceItem => item !== null),
      hidden: [...history.notInterested].map(materialize).filter((item): item is RecommendationPreferenceItem => item !== null),
    }
  }
}
