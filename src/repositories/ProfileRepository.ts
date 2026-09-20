import type { Boundary, VerificationStatus } from '@/domain/types'

export interface ProfileRepository {
  findById(id: string): Promise<Profile | null>
  update(id: string, profile: UpdateProfileDto): Promise<Profile>
}

export type { Boundary, VerificationStatus } from '@/domain/types'

export interface Profile {
  id: string
  name: string
  email: string
  avatarUrl?: string
  bio: string
  location?: string
  availability?: string
  boundaries?: Boundary[]
  rank?: number
  xp?: number
  tokenBalance?: number
  verificationStatus: VerificationStatus
  isSuspended?: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Member-editable profile fields only. Email belongs to auth identity; rank,
 * XP, token balance, verification and suspension belong to trusted authority.
 */
export interface UpdateProfileDto {
  name?: string
  avatarUrl?: string
  bio?: string
  location?: string
  availability?: string
  boundaries?: Boundary[]
}
