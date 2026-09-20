import { createClient as createSupabaseClient } from '@/infrastructure/supabase/server'
import type { Database } from '@/infrastructure/supabase/database.types'
import type {
  ProfileRepository,
  Profile,
  UpdateProfileDto,
} from '@/repositories/ProfileRepository'

export class SupabaseProfileRepository implements ProfileRepository {
  async findById(id: string): Promise<Profile | null> {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, bio, location, availability, boundaries, rank, xp, token_balance, verification_status, is_suspended, created_at, updated_at')
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
      .select()
      .single()

    if (error) throw new Error(`Failed to update profile: ${error.message}`)
    return this.mapToProfile(data)
  }

  private mapToProfile(data: Database['public']['Tables']['profiles']['Row']): Profile {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      location: data.location,
      availability: data.availability,
      boundaries: data.boundaries,
      rank: data.rank,
      xp: data.xp,
      tokenBalance: data.token_balance,
      verificationStatus: data.verification_status,
      isSuspended: data.is_suspended,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }
}
