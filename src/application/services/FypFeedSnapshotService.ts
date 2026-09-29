import 'server-only'

import type { RecommendationMeta } from '@/domain/recommendations/scoring'
import type { Json } from '@/infrastructure/supabase/database.types'
import { createClient } from '@/infrastructure/supabase/server'

export const FYP_FEED_SNAPSHOT_ACTION = 'fyp.feed_snapshot' as const
export const FYP_FEED_SESSION_TTL_MS = 4 * 60 * 60 * 1000
export const FYP_FEED_SNAPSHOT_LIMIT_PER_LANE = 100

export type FypFeedSnapshotLane = 'need' | 'offer'

export type FypFeedSnapshotItem = {
  subjectId: string
  position: number
  recommendation: RecommendationMeta
}

export type FypFeedSessionSnapshot = {
  sessionId: string
  rankingVersion: string
  generatedAt: string
  expiresAt: string
  needs: FypFeedSnapshotItem[]
  offers: FypFeedSnapshotItem[]
}

type AuditSnapshotRow = {
  target_id: string | null
  target_type: string | null
  reason: string | null
  timestamp: string | null
  after: Json | null
}

function asRecord(value: Json | null | undefined): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function parseReasons(value: unknown): RecommendationMeta['reasons'] | null {
  if (!Array.isArray(value)) return null
  const reasons: RecommendationMeta['reasons'] = []
  for (const raw of value) {
    const row = asRecord(raw as Json)
    if (!row || typeof row.code !== 'string' || typeof row.label !== 'string' || typeof row.contribution !== 'number') return null
    reasons.push({
      code: row.code as RecommendationMeta['reasons'][number]['code'],
      label: row.label,
      contribution: row.contribution,
    })
  }
  return reasons
}

function parseItems(value: unknown, rankingVersion: string): FypFeedSnapshotItem[] | null {
  if (!Array.isArray(value)) return null
  const items: FypFeedSnapshotItem[] = []
  for (const raw of value) {
    const row = asRecord(raw as Json)
    if (
      !row
      || typeof row.subjectId !== 'string'
      || typeof row.position !== 'number'
      || typeof row.score !== 'number'
      || typeof row.confidence !== 'number'
    ) return null
    const reasons = parseReasons(row.reasons)
    if (!reasons) return null
    items.push({
      subjectId: row.subjectId,
      position: row.position,
      recommendation: {
        score: row.score,
        confidence: row.confidence,
        reasons,
        rankingVersion,
      },
    })
  }
  return items.sort((left, right) => left.position - right.position)
}

function parseLane(row: AuditSnapshotRow): {
  lane: FypFeedSnapshotLane
  sessionId: string
  rankingVersion: string
  generatedAt: string
  expiresAt: string
  items: FypFeedSnapshotItem[]
} | null {
  if ((row.target_id !== 'need' && row.target_id !== 'offer') || row.target_type !== 'fyp_feed_lane' || !row.reason) return null
  const after = asRecord(row.after)
  if (
    !after
    || typeof after.rankingVersion !== 'string'
    || typeof after.generatedAt !== 'string'
    || typeof after.expiresAt !== 'string'
  ) return null
  const items = parseItems(after.items, after.rankingVersion)
  if (!items) return null
  return {
    lane: row.target_id,
    sessionId: row.reason,
    rankingVersion: after.rankingVersion,
    generatedAt: after.generatedAt,
    expiresAt: after.expiresAt,
    items,
  }
}

export class FypFeedSnapshotService {
  async current(input: {
    actorId: string
    rankingVersion: string
    now: Date
  }): Promise<FypFeedSessionSnapshot | null> {
    const supabase = await createClient()
    const windowStart = new Date(input.now.getTime() - FYP_FEED_SESSION_TTL_MS).toISOString()
    const { data, error } = await supabase
      .from('audit_events')
      .select('target_id,target_type,reason,timestamp,after')
      .eq('actor_id', input.actorId)
      .eq('action', FYP_FEED_SNAPSHOT_ACTION)
      .gte('timestamp', windowStart)
      .order('timestamp', { ascending: false })
      .limit(8)

    if (error) throw new Error(`Failed to read FYP feed snapshot: ${error.message}`)

    const parsed = (data as AuditSnapshotRow[] ?? [])
      .map(parseLane)
      .filter((lane): lane is NonNullable<typeof lane> => lane !== null)
      .filter((lane) => lane.rankingVersion === input.rankingVersion && new Date(lane.expiresAt).getTime() > input.now.getTime())

    for (const lane of parsed) {
      const sibling = parsed.find((candidate) => candidate.sessionId === lane.sessionId && candidate.lane !== lane.lane)
      if (!sibling) continue
      const needLane = lane.lane === 'need' ? lane : sibling
      const offerLane = lane.lane === 'offer' ? lane : sibling
      return {
        sessionId: lane.sessionId,
        rankingVersion: lane.rankingVersion,
        generatedAt: lane.generatedAt,
        expiresAt: lane.expiresAt,
        needs: needLane.items,
        offers: offerLane.items,
      }
    }

    return null
  }

  async create(input: {
    actorId: string
    rankingVersion: string
    now: Date
    needs: FypFeedSnapshotItem[]
    offers: FypFeedSnapshotItem[]
  }): Promise<FypFeedSessionSnapshot> {
    const supabase = await createClient()
    const sessionId = crypto.randomUUID()
    const generatedAt = input.now.toISOString()
    const expiresAt = new Date(input.now.getTime() + FYP_FEED_SESSION_TTL_MS).toISOString()

    const serialize = (items: FypFeedSnapshotItem[]): Json => items
      .slice(0, FYP_FEED_SNAPSHOT_LIMIT_PER_LANE)
      .map((item) => ({
        subjectId: item.subjectId,
        position: item.position,
        score: item.recommendation.score,
        confidence: item.recommendation.confidence,
        reasons: item.recommendation.reasons as unknown as Json,
      })) as Json

    const rows = (['need', 'offer'] as const).map((lane) => ({
      actor_id: input.actorId,
      action: FYP_FEED_SNAPSHOT_ACTION,
      target_type: 'fyp_feed_lane',
      target_id: lane,
      reason: sessionId,
      after: {
        rankingVersion: input.rankingVersion,
        generatedAt,
        expiresAt,
        items: serialize(lane === 'need' ? input.needs : input.offers),
      } as Json,
    }))

    const { error } = await supabase.from('audit_events').insert(rows)
    if (error) throw new Error(`Failed to persist FYP feed snapshot: ${error.message}`)

    return {
      sessionId,
      rankingVersion: input.rankingVersion,
      generatedAt,
      expiresAt,
      needs: input.needs.slice(0, FYP_FEED_SNAPSHOT_LIMIT_PER_LANE),
      offers: input.offers.slice(0, FYP_FEED_SNAPSHOT_LIMIT_PER_LANE),
    }
  }
}
