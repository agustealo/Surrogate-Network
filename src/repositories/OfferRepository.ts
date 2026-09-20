import type { Boundary, SurrogateCategory } from '@/domain/types'

export interface OfferRepository {
  findById(id: string): Promise<Offer | null>
  findAll(limit?: number): Promise<Offer[]>
  findByUserId(userId: string, limit?: number): Promise<Offer[]>
  findByCategory(category: SurrogateCategory, limit?: number): Promise<Offer[]>
  create(offer: CreateOfferDto): Promise<Offer>
  update(id: string, offer: UpdateOfferDto): Promise<Offer>
  delete(id: string): Promise<void>
}

export type { SurrogateCategory, Boundary } from '@/domain/types'
export type LocationMode = 'remote' | 'local' | 'either'
export type OfferStatus = 'active' | 'paused' | 'full'

export interface Offer {
  id: string
  title: string
  description: string
  category: SurrogateCategory
  locationMode: LocationMode
  timing?: string
  boundaries: Boundary[]
  capacity?: number
  currentCapacity?: number
  status: OfferStatus
  userId: string
  userName: string
  userAvatar?: string
  rating?: number
  reviewCount?: number
  createdAt: string
}

/**
 * Member-authored Offer fields only. Lifecycle state, utilization, and
 * reputation are database-authoritative and deliberately absent here.
 */
export interface CreateOfferDto {
  title: string
  description: string
  category: SurrogateCategory
  locationMode: LocationMode
  timing?: string
  boundaries: Boundary[]
  capacity?: number
  userId: string
  userName: string
  userAvatar?: string
}

/** Member-editable Offer fields only. */
export interface UpdateOfferDto {
  title?: string
  description?: string
  category?: SurrogateCategory
  locationMode?: LocationMode
  timing?: string
  boundaries?: Boundary[]
  capacity?: number
  userName?: string
  userAvatar?: string
}
