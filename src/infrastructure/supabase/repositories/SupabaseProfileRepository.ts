import { createClient as createSupabaseClient } from '@/infrastructure/supabase/server'
import type { Database } from '@/infrastructure/supabase/database.types'
import type {
  ProfileRepository,
  Profile,
  UpdateProfileDto,
} from '@/repositories/ProfileRepository'

type ProfileRow = Pick<
  Database['public']['Tables']['profiles']['Row'],
  | 'id'
  | 'name'
  | 'email'
  | 'avatar_url'
  | 'bio'
  | 'location'
  | 'availability'
  | 'boundaries'
  | 'rank'
  | 'xp'
  | 'token_balance'
  | 'verification_status'
  | 'is_suspended'
  | 'created_at'
  | 'updated_at'
>

function required<T>(value: T | null, field: string): T {
  if (value === null) throw new Error(`Malformed profile row: ${field} is null`)
  return value
}

export class SupabaseProfileRepository implements ProfileRepository {
  async findById(id: string): Promise<Profile | null> {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id,name,email,avatar_url,bio,location,availability,boundaries,rank,xp,token_balance,verification_status,is_suspended,created_at,updated_at')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return this.mapToProfile(data)
  }

  async update(id: string, profile: UpdateProfileDto): Promise<Profile> {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: profile.name,
        avatar_url: profile.avatarUrl,
        bio: profile.bio,
        location: profile.location,
        availability: profile.availability,
        boundaries: profile.boundaries,
      })
      .eq('id', id)
      .select('id,name,email,avatar_url,bio,location,availability,boundaries,rank,xp,token_balance,verification_status,is_suspended,created_at,updated_at')
      .single()

    if (error) throw new Error(`Failed to update profile: ${error.message}`)
    return this.mapToProfile(data)
  }

  private mapToProfile(data: ProfileRow): Profile {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatar_url ?? undefined,
      bio: data.bio,
      location: data.location ?? undefined,
      availability: data.availability ?? undefined,
      boundaries: data.boundaries ?? undefined,
      rank: data.rank ?? undefined,
      xp: data.xp ?? undefined,
      tokenBalance: data.token_balance ?? undefined,
      verificationStatus: required(data.verification_status, 'verification_status'),
      isSuspended: data.is_suspended ?? undefined,
      createdAt: required(data.created_at, 'created_at'),
      updatedAt: required(data.updated_at, 'updated_at'),
    }
  }
}
