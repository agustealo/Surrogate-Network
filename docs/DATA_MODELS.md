# Data Models

This document provides comprehensive documentation of Surrogate Network's data models, including current implementations and planned Phase 1 expansions.

## Overview

Surrogate Network uses TypeScript for type safety throughout the application. Data models are organized by domain and follow domain-driven design principles.

### Data Model Philosophy

- **Type Safety**: All data structures are explicitly typed
- **Domain-Driven**: Types reflect real-world concepts
- **Firestore Compatible**: Separate DTO types for Firebase integration
- **Extensible**: Designed for future feature expansion
- **Validation**: Zod schemas for runtime validation (planned)

## Current Data Models (Phase 0)

### Core Types

```typescript
// src/lib/types.ts

export type SurrogateCategory = 'personal' | 'utilitarian_business' | 'casual';
export type Boundary = 'platonic' | 'romantic' | 'physical' | 'virtual' | 'one-off' | 'recurring';
```

#### SurrogateCategory

Describes the nature of needs and offers:

- **personal**: Emotional support, companionship, personal growth
- **utilitarian_business**: Professional services, business exchanges
- **casual**: Social activities, entertainment, casual interactions

#### Boundary

Defines relationship boundaries:

- **platonic**: Non-romantic relationships
- **romantic**: Romantic or intimate relationships
- **physical**: In-person interactions
- **virtual**: Online/remote interactions
- **one-off**: Single occurrence
- **recurring**: Ongoing or repeated interactions

### User & Profile

#### User
```typescript
export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  tokenBalance?: number;
}
```

**Purpose**: Minimal user information used across the application

**Fields**:
- `id`: Unique user identifier
- `name`: Display name
- `avatarUrl`: Optional profile image URL
- `tokenBalance`: Current token balance (planned feature)

#### Profile
```typescript
export interface Profile extends User {
  bio: string;
  offerings: Offering[];
  requests: Request[];
  matchScore?: number;
  portfolioUrl?: string;
  videoIntroUrl?: string;
  badges?: ProfileBadge[];
  createdAt: string;
  strengthMatrix?: StrengthMatrixPoint[];
  reviewSummary?: ReviewSummaryPoint[];
}
```

**Purpose**: Complete user profile with offerings and requests

**Relationships**:
- Extends `User` base interface
- Contains multiple `Offering` objects
- Contains multiple `Request` objects
- Has optional `ProfileBadge` associations

### Needs & Offers

#### Offering (→ Will become Offer in Phase 1)
```typescript
export interface Offering {
  id: string;
  title: string;
  description: string;
  category: SurrogateCategory;
  averageRating?: number;
  ratingCount?: number;
  boundaries?: Boundary[];
  tokenReward?: number;
}
```

**Purpose**: What a user is willing/able to provide

**Phase 1 Expansion**: Will be enhanced to `Offer` with richer fields including capacity, availability, and detailed preferences.

#### Request (→ Will become Need in Phase 1)
```typescript
export interface Request {
  id: string;
  title: string;
  description: string;
  category: SurrogateCategory;
  tags?: string[];
  averageRating?: number;
  ratingCount?: number;
  boundaries?: Boundary[];
  tokenCost?: number;
}
```

**Purpose**: What a user wants fulfilled

**Phase 1 Expansion**: Will be enhanced to `Need` with comprehensive fields including intensity, urgency, and detailed preferences.

### Profile Metadata

#### ProfileBadge
```typescript
export interface ProfileBadge {
  id: string;
  name: string;
  iconUrl?: string;
  description?: string;
}
```

**Purpose**: Recognition badges for achievements and qualities

#### StrengthMatrixPoint
```typescript
export interface StrengthMatrixPoint {
  attribute: string;
  proficiency: number;
}
```

**Purpose**: Self-assessed proficiency in various attributes

**Data Range**: `proficiency` should be 0-100

#### ReviewSummaryPoint
```typescript
export interface ReviewSummaryPoint {
  rating: string; // e.g., "5 Stars", "4 Stars"
  count: number;
}
```

**Purpose**: Summary of ratings received

### Relationship Types

#### Proposal
```typescript
export interface Proposal {
  id: string;
  proposingUser: User;
  theirOffering: Pick<Offering, 'id' | 'title' | 'category'>;
  forYourRequest: Pick<Request, 'id' | 'title' | 'category'>;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  message?: string;
}
```

**Purpose**: Initial proposal to establish a surrogacy relationship

**Phase 1 Expansion**: Will support counter-proposals, detailed terms, and negotiation history.

#### ActiveConnection (→ Will become Surrogacy in Phase 1)
```typescript
export interface ActiveConnection {
  id: string;
  partner: User;
  yourOffering: Pick<Offering, 'id' | 'title' | 'category'>;
  theirOffering: Pick<Offering, 'id' | 'title' | 'category'>;
  startedAt: string;
  status: 'active' | 'completed' | 'archived';
}
```

**Purpose**: Established surrogacy relationships

**Phase 1 Expansion**: Will become `Surrogacy` with richer relationship management features.

### Communication

#### ChatSession
```typescript
export interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  lastMessage: string;
  unreadCount: number;
  avatarUrl?: string;
  timestamp: string;
  interactionFocus?: 'offering' | 'seeking' | 'mutual';
  offerings?: Pick<Offering, 'id' | 'title' | 'category'>[];
}
```

**Purpose**: Messaging session information

**Fields**:
- `interactionFocus`: Type of interaction (offering help, seeking help, or mutual exchange)

### Feedback

#### Feedback
```typescript
export interface Feedback {
  punctuality: number;
  reliability: number;
  communicationClarity: number;
  comments?: string;
  skillEndorsements?: string;
}
```

**Purpose**: User feedback on completed exchanges

**Phase 1 Expansion**: Will become multi-dimensional trust matrix with additional criteria.

### Content Types

#### FeedContentType & FeedItem
```typescript
export type FeedContentType = 'post' | 'video' | 'livestream' | 'shared_need';

export interface FeedItem {
  id: string;
  user: User;
  createdAt: string;
  contentType: FeedContentType;
  textContent?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  dataAiHint?: string;
  likes: number;
  commentsCount: number;
  relatedNeedId?: string;
  relatedNeedTitle?: string;
}
```

**Purpose**: Social feed content (future feature)

### Firestore DTOs

#### FirestoreProfileDTO
```typescript
export interface FirestoreProfileDTO extends Omit<Profile, 'createdAt'> {
  createdAt: Timestamp;
}
```

**Purpose**: Firestore-compatible profile type with Timestamp

**Usage**: Used for Firestore interactions, converted to `Profile` via `fromFirestoreDTO()` function.

#### FirestoreFeedItemDTO
```typescript
export interface FirestoreFeedItemDTO extends Omit<FeedItem, 'id' | 'createdAt'> {
  createdAt: Timestamp;
}
```

**Purpose**: Firestore-compatible feed item type

## Phase 1 Data Models (Planned)

### Core Social Objects

#### Need (Expanded from Request)
```typescript
export interface Need {
  // Basic Information
  id: string;
  userId: string;
  title: string;
  description: string;
  
  // Classification
  category: SurrogateCategory;
  tags?: string[];
  
  // Experience Details
  desiredExperience: string;
  frequency: 'one-time' | 'occasional' | 'weekly' | 'monthly' | 'ongoing';
  duration: string;
  urgency: 'nice-to-have' | 'important' | 'urgent';
  
  // Availability & Location
  availability: AvailabilityWindow[];
  locationPreference: LocationPreference;
  remotePreference: 'remote-only' | 'in-person-only' | 'either';
  
  // Boundaries & Preferences
  boundaries: Boundary[];
  hardBoundaries: string[];
  softPreferences: string[];
  groupSetting: 'one-on-one' | 'group' | 'either';
  reciprocityExpectations?: string;
  
  // Privacy & Access
  privacyLevel: 'public' | 'members-only' | 'selected-surrogates';
  selectedSurrogates?: string[];
  
  // Token & Expiration
  tokenCost?: number;
  expiresAt?: string;
  
  // Status & Metadata
  status: 'active' | 'paused' | 'fulfilled' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityWindow {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  timezone: string;
}

export interface LocationPreference {
  type: 'remote' | 'within-miles' | 'within-city' | 'travel-willing' | 'location-independent';
  miles?: number;
  city?: string;
  approximateLocation?: { lat: number; lng: number };
}
```

#### Offer (Expanded from Offering)
```typescript
export interface Offer {
  // Basic Information
  id: string;
  userId: string;
  title: string;
  description: string;
  
  // Classification
  category: SurrogateCategory;
  
  // Capacity & Availability
  capacity: number; // Maximum concurrent surrogacies
  availability: AvailabilityWindow[];
  frequency: 'one-time' | 'occasional' | 'regular' | 'ongoing';
  
  // Comfort Zones
  comfortableWith: string[];
  notComfortableWith: string[];
  
  // Boundaries & Preferences
  boundaries: Boundary[];
  hardBoundaries: string[];
  groupSetting: 'one-on-one' | 'group' | 'either';
  
  // Privacy & Access
  privacyLevel: 'public' | 'members-only' | 'matching-members';
  visibilityRestrictions?: string[];
  
  // Token & Rating
  tokenReward?: number;
  averageRating?: number;
  ratingCount?: number;
  
  // Status & Metadata
  status: 'active' | 'paused' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
```

### Relationship Objects

#### Surrogacy (Expanded from ActiveConnection)
```typescript
export interface Surrogacy {
  // Identification
  id: string;
  participants: [string, string]; // User IDs
  primaryNeedId: string;
  primaryOfferId: string;
  
  // Agreement Details
  agreement: SurrogacyAgreement;
  
  // Status & Lifecycle
  status: 'active' | 'paused' | 'completed' | 'ended' | 'terminated';
  startedAt: string;
  endedAt?: string;
  
  // Statistics
  totalMoments: number;
  completedExchanges: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface SurrogacyAgreement {
  title: string;
  description: string;
  schedule: RecurringSchedule;
  communicationMethod: CommunicationMethod[];
  location?: LocationPreference;
  boundaries: Boundary[];
  tokenArrangement?: TokenArrangement;
  cancellationPolicy: string;
  exclusivity?: boolean;
  notes?: string;
  lastModified: string;
}

export interface RecurringSchedule {
  frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly';
  dayOfWeek?: number; // 0-6
  time?: string;
  duration: string;
  endDate?: string;
}

export interface CommunicationMethod {
  type: 'in-person' | 'voice' | 'video' | 'text' | 'any';
  platform?: string;
}

export interface TokenArrangement {
  tokensPerExchange: number;
  direction: 'none' | 'offerer-to-seeker' | 'seeker-to-offerer' | 'mutual';
}
```

#### Moment (Scheduled Occurrence)
```typescript
export interface Moment {
  // Identification
  id: string;
  surrogacyId: string;
  
  // Scheduling
  scheduledFor: string;
  duration: string;
  location?: LocationPreference;
  communicationMethod: CommunicationMethod;
  
  // Status
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  
  // Participants
  participants: [string, string]; // User IDs
  confirmedBy: string[];
  
  // Boundaries & Notes
  momentBoundaries?: string[];
  notes?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}
```

#### Exchange (Completed Fulfillment)
```typescript
export interface Exchange {
  // Identification
  id: string;
  momentId: string;
  surrogacyId: string;
  
  // Participants
  providerId: string;
  receiverId: string;
  
  // Fulfillment Details
  fulfilledAt: string;
  duration: string;
  actualLocation?: string;
  actualCommunicationMethod: string;
  
  // Outcomes
  status: 'completed' | 'disputed';
  feedbackGiven: boolean;
  
  // Token Impact
  tokensTransferred?: number;
  tokenTransactionId?: string;
  
  // Metadata
  createdAt: string;
}
```

### Compatibility & Matching

#### CompatibilityMatrix
```typescript
export interface CompatibilityMatrix {
  needId: string;
  offerId: string;
  overallScore: number;
  
  dimensions: CompatibilityDimension[];
  explanation: string;
  recommendations: string[];
}

export interface CompatibilityDimension {
  name: string;
  score: number;
  weight: number;
  factors: string[];
}

export interface CompatibilityDimension {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  factors: string[]; // Explanation of score
}

// Example dimensions
export type CompatibilityDimensionType =
  | 'need-fit'
  | 'availability'
  | 'boundary-fit'
  | 'communication'
  | 'location'
  | 'reliability'
  | 'reciprocity'
  | 'social-energy';
```

### Boundaries & Consent

#### BoundarySystem
```typescript
export interface BoundarySystem {
  // Global boundaries (apply to everything)
  globalBoundaries: GlobalBoundary[];
  
  // Surrogacy-specific boundaries
  surrogacyBoundaries: Map<string, SurrogacyBoundary[]>;
  
  // Moment-specific boundaries
  momentBoundaries: Map<string, MomentBoundary[]>;
  
  // Enforcement rules
  enforcementLevel: 'strict' | 'moderate' | 'lenient';
}

export interface GlobalBoundary {
  id: string;
  userId: string;
  type: BoundaryType;
  description: string;
  appliesTo: 'all' | 'specific-types';
  specificTypes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SurrogacyBoundary {
  id: string;
  surrogacyId: string;
  userId: string;
  type: BoundaryType;
  description: string;
  appliesTo: 'all-moments' | 'specific-moments';
  createdAt: string;
}

export interface MomentBoundary {
  id: string;
  momentId: string;
  userId: string;
  type: BoundaryType;
  description: string;
  temporary: boolean;
  createdAt: string;
}

export type BoundaryType =
  | 'physical'
  | 'emotional'
  | 'time'
  | 'location'
  | 'communication'
  | 'media'
  | 'financial'
  | 'substance'
  | 'other';
```

#### PermissionGrants
```typescript
export interface PermissionGrant {
  id: string;
  subject: string; // User ID granting permission
  recipient: string; // User ID receiving permission
  capability: Capability;
  scope: PermissionScope;
  grantedAt: string;
  expiresAt?: string;
  revocable: boolean;
  revokedAt?: string;
  reason?: string;
}

export type Capability =
  | 'media-view'
  | 'media-download'
  | 'location-view'
  | 'phone-view'
  | 'calendar-view'
  | 'profile-full-view'
  | 'profile-restricted-view'
  | 'messages-access'
  | 'moments-schedule-view';

export interface PermissionScope {
  type: 'all' | 'specific-items' | 'time-limited';
  itemIds?: string[]; // Specific media items, etc.
  timeLimit?: string; // Duration string
}
```

### Trust & Reputation

#### TrustMatrix
```typescript
export interface TrustMatrix {
  userId: string;
  offerId?: string; // Offer-specific trust, undefined = overall
  
  // Trust dimensions (0-5 scale)
  reliability: number;
  communication: number;
  boundaryRespect: number;
  accuracy: number;
  consideration: number;
  followThrough: number;
  
  // Aggregates
  overallScore: number;
  reviewCount: number;
  
  // Trend analysis
  recentTrend: 'improving' | 'stable' | 'declining';
  thirtyDayAverage: number;
  
  // Historical data
  lifetimeAverage: number;
  resolvedDisputes: number;
  
  // Metadata
  lastUpdated: string;
  calculatedAt: string;
}

export interface DetailedFeedback {
  id: string;
  exchangeId: string;
  fromUserId: string;
  toUserId: string;
  offerId: string;
  
  // Trust dimensions
  reliability: number;
  communication: number;
  boundaryRespect: number;
  accuracy: number;
  consideration: number;
  followThrough: number;
  
  // Qualitative feedback
  overallRating: number;
  comments?: string;
  wouldRecommend: boolean;
  
  // Metadata
  createdAt: string;
  moderated: boolean;
  moderationNotes?: string;
}
```

### Economy & Progression

#### TokenLedger
```typescript
export interface TokenLedgerEntry {
  id: string;
  userId: string;
  
  // Transaction details
  type: 'earn' | 'spend' | 'transfer' | 'refund' | 'adjustment';
  amount: number;
  balanceAfter: number;
  
  // Source/destination
  source?: TokenSource;
  destination?: TokenDestination;
  relatedUserId?: string; // For transfers
  relatedEntityId?: string; // Exchange, need, offer, etc.
  
  // Metadata
  description: string;
  createdAt: string;
  expiresAt?: string; // For temporary adjustments
}

export type TokenSource =
  | 'profile-completion'
  | 'exchange-completion'
  | 'positive-feedback'
  | 'achievement'
  | 'streak'
  | 'gift'
  | 'seasonal-reward'
  | 'refund'
  | 'adjustment';

export type TokenDestination =
  | 'need-boost'
  | 'offer-boost'
  | 'media-access'
  | 'premium-feature'
  | 'cosmetic'
  | 'event'
  | 'gift'
  | 'refund'
  | 'adjustment';
```

#### UserProgression
```typescript
export interface UserProgression {
  id: string;
  userId: string;
  
  // Experience points
  totalXP: number;
  currentLevel: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  
  // Rank requirements met
  rankRequirements: RankRequirements;
  
  // Capabilities unlocked
  unlockedCapabilities: Capability[];
  restrictedCapabilities: RestrictedCapability[];
  
  // Statistics
  completedExchanges: number;
  activeSurrogacies: number;
  totalFeedbackReceived: number;
  
  // Achievements
  achievements: string[];
  currentStreak: number;
  longestStreak: number;
  
  // Metadata
  lastActivityAt: string;
  levelUpAt?: string;
}

export interface RankRequirements {
  profileCompletion: number; // 0-100%
  accountAge: number; // Days
  completedExchanges: number;
  trustScore: number;
  noRestrictions: boolean;
}

export interface RestrictedCapability {
  capability: Capability;
  requiredLevel: number;
  reason: string;
}
```

### Media & Visibility

#### MediaAsset
```typescript
export interface MediaAsset {
  id: string;
  userId: string;
  
  // Content details
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  
  // Visibility & Access
  visibility: MediaVisibility;
  accessGrants: MediaAccessGrant[];
  
  // Requirements
  rankRequirement?: number;
  tokenRequirement?: number;
  requestable: boolean;
  
  // Moderation
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderatedAt?: string;
  moderationNotes?: string;
  
  // Lifecycle
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type MediaType =
  | 'image'
  | 'video'
  | 'audio'
  | 'voice-introduction'
  | 'moment-recording'
  | 'private-album'
  | 'pod-media';

export type MediaVisibility =
  | 'public'
  | 'members-only'
  | 'connections-only'
  | 'granted-only'
  | 'blurred-preview';

export interface MediaAccessGrant {
  id: string;
  recipientId: string;
  grantedAt: string;
  expiresAt?: string;
  accessLevel: 'full' | 'preview' | 'thumbnail';
  requestTokenId?: string; // If purchased access
}
```

#### MediaAccessRequest
```typescript
export interface MediaAccessRequest {
  id: string;
  requesterId: string;
  assetId: string;
  
  // Request details
  message?: string;
  tokenOffer: number;
  
  // Status
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  
  // Response
  respondedAt?: string;
  responseMessage?: string;
  
  // Metadata
  createdAt: string;
  expiresAt: string;
}
```

### Notification System

#### Notification
```typescript
export interface Notification {
  id: string;
  userId: string;
  
  // Content
  type: NotificationType;
  title: string;
  message: string;
  
  // Related entities
  relatedUserId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  
  // Status
  read: boolean;
  readAt?: string;
  
  // Actions
  actionUrl?: string;
  actionLabel?: string;
  
  // Priority & Delivery
  priority: 'low' | 'normal' | 'high' | 'urgent';
  deliveryMethod: 'in-app' | 'email' | 'push' | 'sms';
  
  // Metadata
  createdAt: string;
  expiresAt?: string;
}

export type NotificationType =
  | 'surrogacy-proposal'
  | 'surrogacy-accepted'
  | 'surrogacy-responded'
  | 'moment-scheduled'
  | 'moment-reminder'
  | 'exchange-completed'
  | 'feedback-request'
  | 'token-earned'
  | 'token-spent'
  | 'rank-advanced'
  | 'media-request'
  | 'media-granted'
  | 'system-alert'
  | 'safety-alert';
```

### Admin & Audit

#### AuditLogEntry
```typescript
export interface AuditLogEntry {
  id: string;
  
  // Actor
  actorId: string;
  actorType: 'user' | 'admin' | 'system';
  
  // Action
  action: string;
  actionType: 'create' | 'read' | 'update' | 'delete' | 'access' | 'moderate';
  
  // Target
  targetType: string;
  targetId: string;
  
  // Details
  details: Record<string, any>;
  reason?: string;
  
  // Context
  ipAddress?: string;
  userAgent?: string;
  
  // Metadata
  timestamp: string;
}
```

## Firestore Collection Structure

### Current Collections

```typescript
// Phase 0 collections
'profiles'          // User profiles with offerings/requests
```

### Phase 1 Collections

```typescript
// Core social objects
'needs'             // User needs
'offers'            // User offers
'surrogacies'       // Active surrogacy relationships
'moments'           // Scheduled occurrences
'exchanges'         // Completed exchanges

// Compatibility & Matching
'compatibility'     // Compatibility matrices
'proposals'         // Surrogacy proposals

// Boundaries & Consent
'boundaries'        // Boundary definitions
'permission-grants' // Permission grants

// Trust & Reputation
'feedback'          // Detailed feedback
'trust-matrices'    // Trust calculations

// Economy & Progression
'token-ledger'      // Token transactions
'user-progression'  // XP, ranks, capabilities
'achievements'      // Achievement definitions

// Media & Visibility
'media'             // Media assets
'media-requests'    // Access requests

// Notifications
'notifications'     // User notifications

// Admin & Audit
'audit-log'         // System audit trail
'moderation-cases'  // Moderation actions
'reports'           // User reports
```

## Data Relationships

### Current Relationships

```
User
  ├─→ Profile (1:1)
  │    ├─→ Offering[] (1:N)
  │    └─→ Request[] (1:N)
  ├─→ Proposal[] (1:N as proposer)
  └─→ ActiveConnection[] (1:N)
```

### Phase 1 Relationships

```
User
  ├─→ Need[] (1:N)
  ├─→ Offer[] (1:N)
  ├─→ Surrogacy[] (1:N as participant)
  ├─→ Moment[] (1:N as participant)
  ├─→ Exchange[] (1:N as provider/receiver)
  ├─→ Feedback[] (1:N as reviewer/reviewed)
  ├─→ TokenLedgerEntry[] (1:N)
  ├─→ UserProgression (1:1)
  ├─→ MediaAsset[] (1:N)
  ├─→ PermissionGrant[] (1:N as subject)
  ├─→ PermissionGrant[] (1:N as recipient)
  └─→ Notification[] (1:N)

Need
  ├─→ CompatibilityMatrix[] (1:N)
  ├─→ Proposal[] (1:N)
  └─→ Surrogacy[] (1:N via primaryNeedId)

Offer
  ├─→ CompatibilityMatrix[] (1:N)
  ├─→ Proposal[] (1:N)
  └─→ Surrogacy[] (1:N via primaryOfferId)

Surrogacy
  ├─→ Moment[] (1:N)
  ├─→ Exchange[] (1:N)
  └─→ SurrogacyBoundary[] (1:N)

Moment
  ├─→ Exchange[] (1:0-1)
  └─→ MomentBoundary[] (1:N)

Exchange
  ├─→ Feedback[] (1:N)
  └─→ TokenLedgerEntry[] (1:N)
```

## Type Conversion Patterns

### Firestore Timestamp Handling

```typescript
// Firestore DTO with Timestamp fields
export interface FirestoreProfileDTO extends Omit<Profile, 'createdAt'> {
  createdAt: Timestamp;
}

// Conversion function
function fromFirestoreDTO(docId: string, dto: FirestoreProfileDTO): Profile {
  return {
    ...dto,
    id: docId,
    createdAt: dto.createdAt.toDate().toISOString(),
  };
}

// Reverse conversion for Firestore
function toFirestoreDTO(profile: NewProfileData): FirestoreProfileDTO {
  return {
    ...profile,
    createdAt: serverTimestamp(),
  };
}
```

### Data Validation

```typescript
// Zod schema for runtime validation (planned)
const NeedSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  category: z.enum(['personal', 'utilitarian_business', 'casual']),
  urgency: z.enum(['nice-to-have', 'important', 'urgent']),
  // ... other fields
});

// Usage in service functions
async function createNeed(data: unknown): Promise<Need> {
  const validatedData = NeedSchema.parse(data);
  // ... create in Firestore
}
```

## Data Integrity Rules

### Validation Rules

1. **Referential Integrity**:
   - All user IDs must reference existing users
   - Surrogacy participants must exist
   - Related entities must exist (needs, offers, etc.)

2. **Business Logic Validation**:
   - Users cannot surrogacy with themselves
   - Token balances cannot go negative
   - Exchanges cannot be completed before moments
   - Boundaries must be consistent across relationship levels

3. **Data Consistency**:
   - Cascading deletions handled appropriately
   - Status transitions follow valid sequences
   - Time-based validations (expirations, scheduling)

### Enforcement Levels

```typescript
type EnforcementLevel = 'strict' | 'moderate' | 'lenient';

// Strict: Enforce all rules, prevent invalid operations
// Moderate: Warn but allow some flexibility
// Lenient: Log violations but don't block operations
```

## Migration Strategy

### Phase 0 → Phase 1 Migration

1. **Data Model Migration**:
   - Rename `Request` → `Need`
   - Rename `Offering` → `Offer`
   - Rename `ActiveConnection` → `Surrogacy`
   - Add new fields to existing types

2. **Data Migration Script**:
   ```typescript
   // Migrate existing profiles
   async function migrateProfiles() {
     const profiles = await fetchProfiles();
     
     for (const profile of profiles) {
       // Transform requests to needs
       const needs = profile.requests.map(req => ({
         ...req,
         // Add new Phase 1 fields with defaults
         urgency: 'important',
         desiredExperience: req.description,
         frequency: 'ongoing',
         // ... other fields
       }));
       
       // Transform offerings to offers
       const offers = profile.offerings.map(offer => ({
         ...offer,
         // Add new Phase 1 fields
         capacity: 2,
         status: 'active',
         // ... other fields
       }));
       
       // Update profile
       await updateProfile(profile.id, { needs, offers });
     }
   }
   ```

3. **Collection Migration**:
   - Create new Phase 1 collections
   - Migrate data from old structure
   - Update references and relationships
   - Test data integrity

4. **Rollback Plan**:
   - Keep Phase 0 data structure as backup
   - Create migration rollback scripts
   - Test migration on staging environment first

---

**Data Models Documentation Version**: 1.0
**Last Updated**: 2025-08-16
**Maintained By**: Surrogate Network Development Team