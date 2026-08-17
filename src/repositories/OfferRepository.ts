// Repository Interface for Offers
export interface OfferRepository {
  findById(id: string): Promise<Offer | null>;
  findAll(limit?: number): Promise<Offer[]>;
  findByUserId(userId: string, limit?: number): Promise<Offer[]>;
  findByCategory(category: string, limit?: number): Promise<Offer[]>;
  create(offer: CreateOfferDto): Promise<Offer>;
  update(id: string, offer: UpdateOfferDto): Promise<Offer>;
  delete(id: string): Promise<void>;
}

// Domain Types
export type SurrogateCategory = 'personal' | 'utilitarian_business' | 'casual';
export type Boundary = 'platonic' | 'romantic' | 'physical' | 'virtual' | 'one-off' | 'recurring';
export type LocationMode = 'remote' | 'local' | 'either';
export type OfferStatus = 'active' | 'paused' | 'full';

export interface Offer {
  id: string;
  title: string;
  description: string;
  category: SurrogateCategory;
  locationMode: LocationMode;
  timing?: string;
  boundaries: Boundary[];
  capacity?: number;
  currentCapacity?: number;
  status: OfferStatus;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
}

export interface CreateOfferDto {
  title: string;
  description: string;
  category: SurrogateCategory;
  locationMode: LocationMode;
  timing?: string;
  boundaries: Boundary[];
  capacity?: number;
  currentCapacity?: number;
  status?: OfferStatus;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating?: number;
  reviewCount?: number;
}

export interface UpdateOfferDto {
  title?: string;
  description?: string;
  category?: SurrogateCategory;
  locationMode?: LocationMode;
  timing?: string;
  boundaries?: Boundary[];
  capacity?: number;
  currentCapacity?: number;
  status?: OfferStatus;
  rating?: number;
  reviewCount?: number;
}