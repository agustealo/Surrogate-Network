import type { Boundary, SurrogateCategory } from '@/domain/types'

export interface NeedRepository {
  findById(id: string): Promise<Need | null>
  findAll(limit?: number): Promise<Need[]>
  findByUserId(userId: string, limit?: number): Promise<Need[]>
  findByCategory(category: SurrogateCategory, limit?: number): Promise<Need[]>
  create(need: CreateNeedDto): Promise<Need>
  update(id: string, need: UpdateNeedDto): Promise<Need>
}

export type { SurrogateCategory, Boundary } from '@/domain/types'
export type LocationMode = 'remote' | 'local' | 'either'
export type Urgency = 'low' | 'medium' | 'high'
export type NeedStatus = 'active' | 'fulfilled' | 'paused' | 'expired'

export interface Need {
  id: string
  title: string
  description: string
  category: SurrogateCategory
  tags: string[]
  locationMode: LocationMode
  timing?: string
  boundaries: Boundary[]
  urgency?: Urgency
  status: NeedStatus
  userId: string
  userName: string
  userAvatar?: string
  createdAt: string
  expiresAt?: string
}

/**
 * Member-authored Need fields only. Lifecycle status is database-authoritative
 * and deliberately absent from the create contract.
 */
export interface CreateNeedDto {
  title: string
  description: string
  category: SurrogateCategory
  tags?: string[]
  locationMode: LocationMode
  timing?: string
  boundaries: Boundary[]
  urgency?: Urgency
  userId: string
  userName: string
  userAvatar?: string
  expiresAt?: string
}

/** Member-editable Need fields only. */
export interface UpdateNeedDto {
  title?: string
  description?: string
  category?: SurrogateCategory
  tags?: string[]
  locationMode?: LocationMode
  timing?: string
  boundaries?: Boundary[]
  urgency?: Urgency
  userName?: string
  userAvatar?: string
  expiresAt?: string
}
