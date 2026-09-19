import type { ProfileRepository, Profile } from '@/repositories/ProfileRepository'
import type { NeedRepository, Need } from '@/repositories/NeedRepository'
import type { OfferRepository, Offer } from '@/repositories/OfferRepository'

export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly needRepository: NeedRepository,
    private readonly offerRepository: OfferRepository
  ) {}

  async getProfileWithDetails(id: string): Promise<{ profile: Profile; needs: Need[]; offers: Offer[] } | null> {
    const profile = await this.profileRepository.findById(id)
    if (!profile) return null

    const [needs, offers] = await Promise.all([
      this.needRepository.findByUserId(id),
      this.offerRepository.findByUserId(id),
    ])

    return { profile, needs, offers }
  }
}

export class DiscoveryService {
  constructor(
    private readonly needRepository: NeedRepository,
    private readonly offerRepository: OfferRepository
  ) {}

  async searchNeeds(filters: { category?: string; locationMode?: string; urgency?: string; searchTerm?: string }): Promise<Need[]> {
    const term = filters.searchTerm?.trim().toLowerCase()
    return (await this.needRepository.findAll(50)).filter((need) =>
      (!filters.category || need.category === filters.category) &&
      (!filters.locationMode || need.locationMode === filters.locationMode) &&
      (!filters.urgency || need.urgency === filters.urgency) &&
      (!term || need.title.toLowerCase().includes(term) || need.description.toLowerCase().includes(term) || need.tags.some((tag) => tag.toLowerCase().includes(term)))
    )
  }

  async searchOffers(filters: { category?: string; locationMode?: string; searchTerm?: string }): Promise<Offer[]> {
    const term = filters.searchTerm?.trim().toLowerCase()
    return (await this.offerRepository.findAll(50)).filter((offer) =>
      (!filters.category || offer.category === filters.category) &&
      (!filters.locationMode || offer.locationMode === filters.locationMode) &&
      (!term || offer.title.toLowerCase().includes(term) || offer.description.toLowerCase().includes(term))
    )
  }
}
