import { createClient as createSupabaseClient } from '@/infrastructure/supabase/server'

export class CapabilityService {
  async canUserAccess(userId: string, resourceType: string, resourceId: string): Promise<boolean> {
    const supabase = createSupabaseClient()
    
    // Check if user is suspended
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_suspended')
      .eq('id', userId)
      .single()

    if (profile?.is_suspended) {
      return false
    }

    switch (resourceType) {
      case 'profile':
        return await this.canAccessProfile(userId, resourceId)
      case 'need':
        return await this.canAccessNeed(userId, resourceId)
      case 'offer':
        return await this.canAccessOffer(userId, resourceId)
      case 'surrogacy':
        return await this.canAccessSurrogacy(userId, resourceId)
      default:
        return false
    }
  }

  async canCreateNeed(userId: string): Promise<boolean> {
    const supabase = createSupabaseClient()
    
    // Check user status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_suspended, verification_status')
      .eq('id', userId)
      .single()

    if (!profile || profile.is_suspended) {
      return false
    }

    // Require at least email verification to create needs
    return profile.verification_status !== 'unverified'
  }

  async canCreateOffer(userId: string): Promise<boolean> {
    const supabase = createSupabaseClient()
    
    // Check user status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_suspended, verification_status')
      .eq('id', userId)
      .single()

    if (!profile || profile.is_suspended) {
      return false
    }

    // Require at least email verification to create offers
    return profile.verification_status !== 'unverified'
  }

  private async canAccessProfile(userId: string, profileId: string): Promise<boolean> {
    // Users can always view public profiles
    if (userId === profileId) {
      return true
    }

    const supabase = createSupabaseClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .single()

    return !!profile
  }

  private async canAccessNeed(userId: string, needId: string): Promise<boolean> {
    const supabase = createSupabaseClient()
    const { data: need } = await supabase
      .from('needs')
      .select('user_id, status')
      .eq('id', needId)
      .single()

    if (!need) {
      return false
    }

    // Users can view all active needs
    if (need.status === 'active') {
      return true
    }

    // Users can view their own needs
    return need.user_id === userId
  }

  private async canAccessOffer(userId: string, offerId: string): Promise<boolean> {
    const supabase = createSupabaseClient()
    const { data: offer } = await supabase
      .from('offers')
      .select('user_id, status')
      .eq('id', offerId)
      .single()

    if (!offer) {
      return false
    }

    // Users can view all active offers
    if (offer.status === 'active') {
      return true
    }

    // Users can view their own offers
    return offer.user_id === userId
  }

  private async canAccessSurrogacy(userId: string, surrogacyId: string): Promise<boolean> {
    const supabase = createSupabaseClient()
    const { data: surrogacy } = await supabase
      .from('surrogacies')
      .select('partner_ids')
      .eq('id', surrogacyId)
      .single()

    if (!surrogacy) {
      return false
    }

    // Users can only view surrogacies they're involved in
    return surrogacy.partner_ids.includes(userId)
  }
}