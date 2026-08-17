import { createClient as createSupabaseClient } from '@/infrastructure/supabase/server'
import type { 
  OfferRepository, 
  Offer, 
  CreateOfferDto, 
  UpdateOfferDto 
} from '@/repositories/OfferRepository'

export class SupabaseOfferRepository implements OfferRepository {
  async findById(id: string): Promise<Offer | null> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToOffer(data)
  }

  async findAll(limit: number = 20): Promise<Offer[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) {
      return []
    }

    return data.map(offer => this.mapToOffer(offer))
  }

  async findByUserId(userId: string, limit: number = 20): Promise<Offer[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) {
      return []
    }

    return data.map(offer => this.mapToOffer(offer))
  }

  async findByCategory(category: string, limit: number = 20): Promise<Offer[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) {
      return []
    }

    return data.map(offer => this.mapToOffer(offer))
  }

  async create(offer: CreateOfferDto): Promise<Offer> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('offers')
      .insert({
        title: offer.title,
        description: offer.description,
        category: offer.category,
        location_mode: offer.locationMode,
        timing: offer.timing,
        boundaries: offer.boundaries,
        capacity: offer.capacity,
        current_capacity: offer.currentCapacity || 0,
        status: offer.status || 'active',
        user_id: offer.userId,
        user_name: offer.userName,
        user_avatar: offer.userAvatar,
        rating: offer.rating,
        review_count: offer.reviewCount || 0
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create offer: ${error.message}`)
    }

    return this.mapToOffer(data)
  }

  async update(id: string, offer: UpdateOfferDto): Promise<Offer> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('offers')
      .update({
        title: offer.title,
        description: offer.description,
        category: offer.category,
        location_mode: offer.locationMode,
        timing: offer.timing,
        boundaries: offer.boundaries,
        capacity: offer.capacity,
        current_capacity: offer.currentCapacity,
        status: offer.status,
        rating: offer.rating,
        review_count: offer.reviewCount
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update offer: ${error.message}`)
    }

    return this.mapToOffer(data)
  }

  async delete(id: string): Promise<void> {
    const supabase = createSupabaseClient()
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete offer: ${error.message}`)
    }
  }

  private mapToOffer(data: any): Offer {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      locationMode: data.location_mode,
      timing: data.timing,
      boundaries: data.boundaries || [],
      capacity: data.capacity,
      currentCapacity: data.current_capacity,
      status: data.status,
      userId: data.user_id,
      userName: data.user_name,
      userAvatar: data.user_avatar,
      rating: data.rating,
      reviewCount: data.review_count,
      createdAt: data.created_at
    }
  }
}