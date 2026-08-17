export type SurrogateCategory = 'personal' | 'utilitarian_business' | 'casual';
export type Boundary = 'platonic' | 'romantic' | 'physical' | 'virtual' | 'one-off' | 'recurring';

export interface BaseProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile extends BaseProfile {
  location?: string;
  availability?: string;
  boundaries?: Boundary[];
  rank?: number;
  xp?: number;
  tokenBalance?: number;
  verificationStatus: VerificationStatus;
  isSuspended?: boolean;
}

export type VerificationStatus = 
  | 'unverified'
  | 'email_verified'
  | 'phone_verified'
  | 'photo_verified'
  | 'identity_verified'
  | 'fully_verified';

export interface Need {
  id: string;
  title: string;
  description: string;
  category: SurrogateCategory;
  tags: string[];
  locationMode: 'remote' | 'local' | 'either';
  timing?: string;
  boundaries: Boundary[];
  urgency?: 'low' | 'medium' | 'high';
  status: 'active' | 'fulfilled' | 'paused' | 'expired';
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  category: SurrogateCategory;
  locationMode: 'remote' | 'local' | 'either';
  timing?: string;
  boundaries: Boundary[];
  capacity?: number;
  currentCapacity?: number;
  status: 'active' | 'paused' | 'full';
  userId: string;
  userName: string;
  userAvatar?: string;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
}

export interface Proposal {
  id: string;
  needId: string;
  offerId: string;
  proposingUserId: string;
  receivingUserId: string;
  proposedDate?: string;
  duration?: string;
  frequency?: string;
  locationMethod?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'countered' | 'withdrawn';
  createdAt: string;
  updatedAt: string;
}

export interface Surrogacy {
  id: string;
  needId: string;
  offerId: string;
  partnerIds: string[];
  status: 'active' | 'paused' | 'ended' | 'completed';
  startedAt: string;
  endedAt?: string;
  agreement?: {
    boundaries: Boundary[];
    expectations: string[];
    communicationMethod: string;
  };
}

export interface Moment {
  id: string;
  surrogacyId: string;
  scheduledTime: string;
  duration: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'missed';
  location?: string;
  notes?: string;
  createdAt: string;
}

export interface Exchange {
  id: string;
  momentId: string;
  surrogacyId: string;
  completedAt: string;
  status: 'completed' | 'partial' | 'disputed';
}

export interface Feedback {
  id: string;
  exchangeId: string;
  surrogacyId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  breakdown: {
    reliability: number;
    communication: number;
    boundaryRespect: number;
    consideration: number;
    followThrough: number;
  };
  comments?: string;
  skillEndorsements?: string[];
  createdAt: string;
}

export interface MediaGrant {
  id: string;
  mediaId: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'granted' | 'denied' | 'expired';
  requestedAt: string;
  respondedAt?: string;
  expiresAt?: string;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earned' | 'spent' | 'granted' | 'penalty';
  reason: string;
  referenceId?: string;
  referenceType?: 'exchange' | 'feedback' | 'proposal' | 'grant' | 'penalty';
  createdAt: string;
}

export interface XPEvent {
  id: string;
  userId: string;
  amount: number;
  source: 'exchange' | 'feedback' | 'login' | 'profile_completion' | 'referral' | 'achievement';
  description: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: {
    type: 'count' | 'rating' | 'streak' | 'combination';
    target: number;
    metric?: string;
  };
  reward: {
    xp: number;
    tokens?: number;
    rankUnlocks?: string[];
  };
}

export interface Rank {
  level: number;
  title: string;
  xpRequired: number;
  unlockedFeatures: string[];
  color?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'proposal' | 'surrogacy' | 'schedule' | 'media' | 'feedback' | 'token' | 'rank' | 'reward' | 'moderation' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reportedUserId: string;
  reporterUserId: string;
  type: 'harassment' | 'inappropriate_content' | 'boundary_violation' | 'spam' | 'impersonation' | 'other';
  severity: 'low' | 'medium' | 'high';
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  actionTaken?: string;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  capabilities: Capability[];
}

export type Capability =
  | 'view_members'
  | 'edit_members'
  | 'suspend_members'
  | 'view_reports'
  | 'moderate_content'
  | 'manage_tokens'
  | 'view_ledger'
  | 'edit_settings'
  | 'view_audit'
  | 'manage_ranks'
  | 'view_analytics';

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetId?: string;
  targetType?: string;
  before?: any;
  after?: any;
  reason?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}