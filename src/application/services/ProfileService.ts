import type { Profile } from '@/repositories/ProfileRepository'
import type { Need } from '@/repositories/NeedRepository'
import type { Offer } from '@/repositories/OfferRepository'

export class ProfileService {
  constructor(
    private profileRepository: any,
    private needRepository: any,
    private offerRepository: any
  ) {}

  async getProfileWithDetails(id: string): Promise<{
    profile: Profile | null;
    needs: Need[];
    offers: Offer[];
  } | null> {
    const profile = await this.profileRepository.findById(id)
    if (!profile) return null

    const [needs, offers] = await Promise.all([
      this.needRepository.findByUserId(id),
      this.offerRepository.findByUserId(id)
    ])

    return { profile, needs, offers }
  }

  async updateProfileVerificationStatus(id: string, status: 'email_verified' | 'phone_verified' | 'photo_verified' | 'identity_verified' | 'fully_verified'): Promise<Profile> {
    return await this.profileRepository.update(id, { verificationStatus: status })
  }

  async awardTokens(id: string, amount: number, reason: string): Promise<void> {
    const profile = await this.profileRepository.findById(id)
    if (!profile) {
      throw new Error('Profile not found')
    }

    const newBalance = (profile.tokenBalance || 0) + amount
    await this.profileRepository.update(id, { tokenBalance: newBalance })

    // Note: Token transactions should be handled by a separate service for proper audit trail
  }

  async awardXP(id: string, amount: number, source: string): Promise<void> {
    const profile = await this.profileRepository.findById(id)
    if (!profile) {
      throw new Error('Profile not found')
    }

    const newXP = (profile.xp || 0) + amount
    const newRank = this.calculateRank(newXP)

    await this.profileRepository.update(id, { 
      xp: newXP,
      rank: newRank
    })

    // Note: XP transactions should be handled by a separate service for proper audit trail
  }

  private calculateRank(xp: number): number {
    if (xp >= 5000) return 5
    if (xp >= 3000) return 4
    if (xp >= 1500) return 3
    if (xp >= 500) return 2
    return 1
  }
}

export class DiscoveryService {
  constructor(
    private needRepository: any,
    private offerRepository: any
  ) {}

  async searchNeeds(filters: {
    category?: string;
    locationMode?: string;
    urgency?: string;
    searchTerm?: string;
  }): Promise<Need[]> {
    let needs = await this.needRepository.findAll(50)

    if (filters.category) {
      needs = needs.filter(need => need.category === filters.category)
    }

    if (filters.locationMode) {
      needs = needs.filter(need => need.locationMode === filters.locationMode)
    }

    if (filters.urgency) {
      needs = needs.filter(need => need.urgency === filters.urgency)
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      needs = needs.filter(need => 
        need.title.toLowerCase().includes(term) ||
        need.description.toLowerCase().includes(term) ||
        need.tags.some(tag => tag.toLowerCase().includes(term))
      )
    }

    return needs
  }

  async searchOffers(filters: {
    category?: string;
    locationMode?: string;
    searchTerm?: string;
  }): Promise<Offer[]> {
    let offers = await this.offerRepository.findAll(50)

    if (filters.category) {
      offers = offers.filter(offer => offer.category === filters.category)
    }

    if (filters.locationMode) {
      offers = offers.filter(offer => offer.locationMode === filters.locationMode)
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      offers = offers.filter(offer => 
        offer.title.toLowerCase().includes(term) ||
        offer.description.toLowerCase().includes(term)
      )
    }

    return offers
  }
}