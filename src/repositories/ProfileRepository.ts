// Repository Interface for Profiles
export interface ProfileRepository {
  findById(id: string): Promise<Profile | null>;
  findAll(limit?: number): Promise<Profile[]>;
  findByEmail(email: string): Promise<Profile | null>;
  create(profile: CreateProfileDto): Promise<Profile>;
  update(id: string, profile: UpdateProfileDto): Promise<Profile>;
  delete(id: string): Promise<void>;
}

// Domain Types
export type Boundary = 'platonic' | 'romantic' | 'physical' | 'virtual' | 'one-off' | 'recurring';
export type VerificationStatus = 'unverified' | 'email_verified' | 'phone_verified' | 'photo_verified' | 'identity_verified' | 'fully_verified';

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio: string;
  location?: string;
  availability?: string;
  boundaries?: Boundary[];
  rank?: number;
  xp?: number;
  tokenBalance?: number;
  verificationStatus: VerificationStatus;
  isSuspended?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfileDto {
  name: string;
  email: string;
  avatarUrl?: string;
  bio: string;
  location?: string;
  availability?: string;
  boundaries?: Boundary[];
  rank?: number;
  xp?: number;
  tokenBalance?: number;
  verificationStatus?: VerificationStatus;
}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  availability?: string;
  boundaries?: Boundary[];
  rank?: number;
  xp?: number;
  tokenBalance?: number;
  verificationStatus?: VerificationStatus;
  isSuspended?: boolean;
}