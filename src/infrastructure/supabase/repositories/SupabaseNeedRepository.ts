import { createClient as createSupabaseClient } from '@/infrastructure/supabase/server'
import type { Database } from '@/infrastructure/supabase/database.types'
import type {
  NeedRepository,
  Need,
  CreateNeedDto,
  UpdateNeedDto,
} from '@/repositories/NeedRepository'

export class SupabaseNeedRepository implements NeedRepository {
  async findById(id: string): Promise<Need | null> {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('needs')
      .select('id,title,description,category,tags,location_mode,timing,boundaries,urgency,status,user_id,user_name,user_avatar,created_at,expires_at')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return this.mapToNeed(data)
  }

  async findAll(limit = 20): Promise<Need[]> {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('needs')
      .select('id,title,description,category,tags,location_mode,timing,boundaries,urgency,status,user_id,user_name,user_avatar,created_at,expires_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return data.map((need) => this.mapToNeed(need))
  }

  async findByUserId(userId: string, limit = 20): Promise<Need[]> {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('needs')
      .select('id,title,description,category,tags,location_mode,timing,boundaries,urgency,status,user_id,user_name,user_avatar,created_at,expires_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return data.map((need) => this.mapToNeed(need))
  }

  async findByCategory(category: Need['category'], limit = 20): Promise<Need[]> {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('needs')
      .select('id,title,description,category,tags,location_mode,timing,boundaries,urgency,status,user_id,user_name,user_avatar,created_at,expires_at')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return data.map((need) => this.mapToNeed(need))
  }

  async create(need: CreateNeedDto): Promise<Need> {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('needs')
      .insert({
        title: need.title,
        description: need.description,
        category: need.category,
        tags: need.tags || [],
        location_mode: need.locationMode,
        timing: need.timing,
        boundaries: need.boundaries,
        urgency: need.urgency,
        user_id: need.userId,
        user_name: need.userName,
        user_avatar: need.userAvatar,
        expires_at: need.expiresAt,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create need: ${error.message}`)
    return this.mapToNeed(data)
  }

  async update(id: string, need: UpdateNeedDto): Promise<Need> {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('needs')
      .update({
        title: need.title,
        description: need.description,
        category: need.category,
        tags: need.tags,
        location_mode: need.locationMode,
        timing: need.timing,
        boundaries: need.boundaries,
        urgency: need.urgency,
        user_name: need.userName,
        user_avatar: need.userAvatar,
        expires_at: need.expiresAt,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update need: ${error.message}`)
    return this.mapToNeed(data)
  }

  private mapToNeed(data: Database['public']['Tables']['needs']['Row']): Need {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      tags: data.tags || [],
      locationMode: data.location_mode,
      timing: data.timing,
      boundaries: data.boundaries || [],
      urgency: data.urgency,
      status: data.status,
      userId: data.user_id,
      userName: data.user_name,
      userAvatar: data.user_avatar,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
    }
  }
}
