import { createClient as createSupabaseClient } from '@/infrastructure/supabase/server'
import type { 
  ProfileRepository, 
  Profile, 
  CreateProfileDto, 
  UpdateProfileDto 
} from '@/repositories/ProfileRepository'

export class SupabaseProfileRepository implements ProfileRepository {
  async findById(id: string): Promise<Profile | null> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToProfile(data)
  }

  async findAll(limit: number = 20): Promise<Profile[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) {
      return []
    }

    return data.map(profile => this.mapToProfile(profile))
  }

  async findByEmail(email: string): Promise<Profile | null> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToProfile(data)
  }

  async create(profile: CreateProfileDto): Promise<Profile> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        name: profile.name,
        email: profile.email,
        avatar_url: profile.avatarUrl,
        bio: profile.bio,
        location: profile.location,
        availability: profile.availability,
        boundaries: profile.boundaries,
        rank: profile.rank || 1,
        xp: profile.xp || 0,
        token_balance: profile.tokenBalance || 0,
        verification_status: profile.verificationStatus || 'unverified'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`)
    }

    return this.mapToProfile(data)
  }

  async update(id: string, profile: UpdateProfileDto): Promise<Profile> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: profile.name,
        email: profile.email,
        avatar_url: profile.avatarUrl,
        bio: profile.bio,
        location: profile.location,
        availability: profile.availability,
        boundaries: profile.boundaries,
        rank: profile.rank,
        xp: profile.xp,
        token_balance: profile.tokenBalance,
        verification_status: profile.verificationStatus,
        is_suspended: profile.isSuspended
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`)
    }

    return this.mapToProfile(data)
  }

  async delete(id: string): Promise<void> {
    const supabase = createSupabaseClient()
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete profile: ${error.message}`)
    }
  }

  private mapToProfile(data: any): Profile {
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
      updatedAt: data.updated_at
    }
  }
}