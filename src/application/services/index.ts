import { SupabaseProfileRepository } from '@/infrastructure/supabase/repositories/SupabaseProfileRepository'
import { SupabaseNeedRepository } from '@/infrastructure/supabase/repositories/SupabaseNeedRepository'
import { SupabaseOfferRepository } from '@/infrastructure/supabase/repositories/SupabaseOfferRepository'
import { ProfileService } from '@/application/services/ProfileService'
import { DiscoveryService } from '@/application/services/ProfileService'
import { CapabilityService } from '@/application/services/CapabilityService'

// Repository instances
const profileRepository = new SupabaseProfileRepository()
const needRepository = new SupabaseNeedRepository()
const offerRepository = new SupabaseOfferRepository()

// Service instances
const profileService = new ProfileService(profileRepository, needRepository, offerRepository)
const discoveryService = new DiscoveryService(needRepository, offerRepository)
const capabilityService = new CapabilityService()

// Export for dependency injection or testing
export {
  profileRepository,
  needRepository,
  offerRepository,
  profileService,
  discoveryService,
  capabilityService
}