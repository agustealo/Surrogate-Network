import { createClient as createSupabaseClient } from '@/infrastructure/supabase/server'
import type { 
  NeedRepository, 
  Need, 
  CreateNeedDto, 
  UpdateNeedDto 
} from '@/repositories/NeedRepository'

export class SupabaseNeedRepository implements NeedRepository {
  async findById(id: string): Promise<Need | null> {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('needs')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToNeed(data)
  }

  async findAll(limit: number = 20): Promise<Need[]> {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('needs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) {
      return []
    }

    return data.map((need: any) => this.mapToNeed(need))
  }

  async findByUserId(userId: string, limit: number = 20): Promise<Need[]> {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('needs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) {
      return []
    }

    return data.map((need: any) => this.mapToNeed(need))
  }

  async findByCategory(category: string, limit: number = 20): Promise<Need[]> {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('needs')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) {
      return []
    }

    return data.map((need: any) => this.mapToNeed(need))
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
        status: need.status || 'active',
        user_id: need.userId,
        user_name: need.userName,
        user_avatar: need.userAvatar,
        expires_at: need.expiresAt
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create need: ${error.message}`)
    }

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
        status: need.status,
        expires_at: need.expiresAt
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update need: ${error.message}`)
    }

    return this.mapToNeed(data)
  }

  async delete(id: string): Promise<void> {
    const supabase = await createSupabaseClient()
    const { error } = await supabase
      .from('needs')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete need: ${error.message}`)
    }
  }

  private mapToNeed(data: any): Need {
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
      expiresAt: data.expires_at
    }
  }
}