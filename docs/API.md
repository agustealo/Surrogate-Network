# API Reference

This document provides comprehensive documentation of Surrogate Network's service layer API, including current implementations and planned Phase 1 expansions.

## Overview

Surrogate Network uses a service layer pattern to separate business logic from presentation. Services handle all database interactions, business rules, and data transformations.

### Service Layer Philosophy

- **Business Logic First**: All business rules live in services, not components
- **Type Safety**: Explicit input/output types for all functions
- **Error Handling**: Consistent error handling across services
- **Firebase Integration**: Direct Firestore operations with proper type conversion
- **Reusable Patterns**: Consistent patterns across all services

## Current Services (Phase 0)

### Profile Service

**Location**: `src/services/profileService.ts`

**Purpose**: Manage user profiles with offerings and requests

#### Functions

##### fetchProfiles

```typescript
async function fetchProfiles(count: number = 20): Promise<Profile[]>
```

**Description**: Fetches a list of profiles from Firestore

**Parameters**:
- `count` (optional): Number of profiles to fetch, default 20

**Returns**: `Promise<Profile[]>` - Array of profile objects

**Usage**:
```typescript
const profiles = await fetchProfiles(10);
// Returns most recent 10 profiles
```

**Implementation Details**:
- Orders by `createdAt` descending
- Uses Firestore query with `limit()`
- Converts Firestore timestamps to ISO strings
- Handles errors with descriptive messages

**Error Handling**:
- Throws `Error("Could not fetch profiles.")` on failure

---

##### fetchProfileById

```typescript
async function fetchProfileById(id: string): Promise<Profile | null>
```

**Description**: Fetches a single profile by ID

**Parameters**:
- `id`: Profile ID to fetch

**Returns**: `Promise<Profile | null>` - Profile object or null if not found

**Usage**:
```typescript
const profile = await fetchProfileById('user123');
if (profile) {
  console.log(profile.name);
}
```

**Implementation Details**:
- Validates ID is non-empty string
- Returns null for non-existent profiles
- Provides detailed error messages
- Converts Firestore timestamps to ISO strings

**Error Handling**:
- Returns `null` for invalid or missing profiles
- Throws detailed error with original error message on failures

---

##### addProfile

```typescript
async function addProfile(profileData: NewProfileData): Promise<string>
```

**Description**: Creates a new profile in Firestore

**Parameters**:
- `profileData`: Profile data without `id` and `createdAt`

**Returns**: `Promise<string>` - ID of the newly created profile

**Usage**:
```typescript
const newProfileId = await addProfile({
  name: 'John Doe',
  bio: 'Looking for meaningful connections',
  offerings: [],
  requests: [],
  // ... other fields
});
```

**Implementation Details**:
- Uses `serverTimestamp()` for `createdAt`
- Ensures embedded arrays are plain objects for Firestore
- Returns Firestore-generated document ID

**Error Handling**:
- Throws `Error("Could not add profile.")` on failure

---

### Type Definitions

#### FirestoreProfileDTO

```typescript
export interface FirestoreProfileDTO extends Omit<Profile, 'createdAt'> {
  createdAt: Timestamp;
}
```

**Purpose**: Firestore-compatible profile type with Timestamp

#### NewProfileData

```typescript
export type NewProfileData = Omit<Profile, 'id' | 'createdAt'>;
```

**Purpose**: Type for creating new profiles

---

## Planned Services (Phase 1)

### Need Service

**Location**: `src/services/needService.ts` (planned)

**Purpose**: Manage user needs throughout lifecycle

#### Functions

##### createNeed

```typescript
async function createNeed(
  userId: string, 
  data: CreateNeedData
): Promise<Need>
```

**Description**: Create a new need for a user

**Parameters**:
- `userId`: User creating the need
- `data`: Need data

**Returns**: `Promise<Need>` - Created need object

**Business Rules**:
- Validate user exists and is active
- Check need title and description are appropriate
- Validate boundary combinations are valid
- Apply default values for optional fields
- Set initial status as 'active'

**Error Handling**:
- `ValidationError`: Invalid input data
- `UserNotFoundError`: User doesn't exist
- `RateLimitError`: Too many needs created recently

---

##### getNeed

```typescript
async function getNeed(id: string, requestingUserId?: string): Promise<Need | null>
```

**Description**: Get a need by ID with permission checks

**Parameters**:
- `id`: Need ID
- `requestingUserId`: User requesting access (for permission checks)

**Returns**: `Promise<Need | null>` - Need object or null

**Business Rules**:
- Check user has permission to view need
- Respect privacy settings
- Blur sensitive information if needed
- Return null for private needs without permission

---

##### listNeeds

```typescript
async function listNeeds(filters: NeedFilters): Promise<Need[]>
```

**Description**: List needs with filtering and pagination

**Parameters**:
- `filters`: Filter criteria

**Returns**: `Promise<Need[]>` - Array of needs

**Filter Options**:
```typescript
interface NeedFilters {
  userId?: string;
  category?: SurrogateCategory;
  urgency?: string[];
  status?: string[];
  location?: LocationFilter;
  privacyLevel?: string[];
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'urgency' | 'tokenCost';
}
```

---

##### updateNeed

```typescript
async function updateNeed(
  id: string, 
  userId: string, 
  data: UpdateNeedData
): Promise<Need>
```

**Description**: Update an existing need

**Parameters**:
- `id`: Need ID
- `userId`: User making the update (must be need owner)
- `data`: Fields to update

**Business Rules**:
- Validate user owns the need
- Check updates don't violate business rules
- Maintain audit trail of changes
- Update timestamp

---

##### deleteNeed

```typescript
async function deleteNeed(id: string, userId: string): Promise<void>
```

**Description**: Delete a need

**Business Rules**:
- Validate user owns the need
- Check no active proposals/exchanges depend on need
- Soft delete or hard delete based on activity
- Maintain audit trail

---

### Offer Service

**Location**: `src/services/offerService.ts` (planned)

**Purpose**: Manage user offers and capacity

#### Functions

##### createOffer

```typescript
async function createOffer(
  userId: string, 
  data: CreateOfferData
): Promise<Offer>
```

**Description**: Create a new offer for a user

**Parameters**:
- `userId`: User creating the offer
- `data`: Offer data

**Business Rules**:
- Validate user exists and is active
- Check user capacity allows new offer
- Validate offer details are appropriate
- Apply default values for optional fields
- Set initial status as 'active'

---

##### getOffer

```typescript
async function getOffer(id: string, requestingUserId?: string): Promise<Offer | null>
```

**Description**: Get an offer by ID with permission checks

**Parameters**:
- `id`: Offer ID
- `requestingUserId`: User requesting access (for permission checks)

**Returns**: `Promise<Offer | null>` - Offer object or null

**Business Rules**:
- Check user has permission to view offer
- Respect visibility settings
- Return null for private offers without permission

---

##### listOffers

```typescript
async function listOffers(filters: OfferFilters): Promise<Offer[]>
```

**Description**: List offers with filtering and pagination

**Parameters**:
- `filters`: Filter criteria

**Returns**: `Promise<Offer[]>` - Array of offers

**Filter Options**:
```typescript
interface OfferFilters {
  userId?: string;
  category?: SurrogateCategory;
  status?: string[];
  privacyLevel?: string[];
  hasCapacity?: boolean;
  location?: LocationFilter;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'rating' | 'tokenReward';
}
```

---

##### updateOffer

```typescript
async function updateOffer(
  id: string, 
  userId: string, 
  data: UpdateOfferData
): Promise<Offer>
```

**Description**: Update an existing offer

**Parameters**:
- `id`: Offer ID
- `userId`: User making the update (must be offer owner)
- `data`: Fields to update

**Business Rules**:
- Validate user owns the offer
- Check updates don't violate business rules
- Maintain audit trail of changes
- Update timestamp

---

##### checkOfferCapacity

```typescript
async function checkOfferCapacity(offerId: string): Promise<CapacityStatus>
```

**Description**: Check if an offer has capacity for new surrogacies

**Returns**: Capacity status with availability information

**Capacity Status**:
```typescript
interface CapacityStatus {
  hasCapacity: boolean;
  currentSurrogacies: number;
  maxCapacity: number;
  availableSlots: number;
  onWaitlist: boolean;
}
```

---

### Surrogacy Service

**Location**: `src/services/surrogacyService.ts` (planned)

**Purpose**: Manage surrogacy relationships and agreements

#### Functions

##### createSurrogacy

```typescript
async function createSurrogacy(
  proposal: AcceptedProposal
): Promise<Surrogacy>
```

**Description**: Create a new surrogacy from an accepted proposal

**Parameters**:
- `proposal`: Accepted proposal with agreement details

**Business Rules**:
- Validate proposal was properly accepted
- Check both participants have capacity
- Validate agreement terms
- Create surrogacy with initial status
- Set up boundaries and permissions
- Update proposal status

---

##### getSurrogacy

```typescript
async function getSurrogacy(
  id: string, 
  requestingUserId: string
): Promise<Surrogacy | null>
```

**Description**: Get a surrogacy by ID with permission checks

**Parameters**:
- `id`: Surrogacy ID
- `requestingUserId`: User requesting access

**Business Rules**:
- Validate user is participant in surrogacy
- Check surrogacy status allows viewing
- Apply permission filters if needed

---

##### listUserSurrogacies

```typescript
async function listUserSurrogacies(
  userId: string, 
  filters: SurrogacyFilters
): Promise<Surrogacy[]>
```

**Description**: List surrogacies for a user

**Parameters**:
- `userId`: User ID
- `filters`: Filter criteria

**Filter Options**:
```typescript
interface SurrogacyFilters {
  status?: SurrogacyStatus[];
  role?: 'initiator' | 'responder' | 'both';
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'lastActivity' | 'nextMoment';
}
```

---

##### updateSurrogacy

```typescript
async function updateSurrogacy(
  id: string, 
  userId: string, 
  data: UpdateSurrogacyData
): Promise<Surrogacy>
```

**Description**: Update surrogacy details

**Parameters**:
- `id`: Surrogacy ID
- `userId`: User making update (must be participant)
- `data`: Fields to update

**Business Rules**:
- Validate user is participant
- Check status allows updates
- Validate agreement modifications
- Maintain audit trail

---

##### pauseSurrogacy

```typescript
async function pauseSurrogacy(
  id: string, 
  userId: string, 
  reason?: string
): Promise<Surrogacy>
```

**Description**: Pause an active surrogacy

**Business Rules**:
- Validate user is participant
- Check surrogacy is active
- Cancel upcoming moments
- Notify other participant
- Update status and timestamp

---

##### endSurrogacy

```typescript
async function endSurrogacy(
  id: string, 
  userId: string, 
  reason?: string
): Promise<Surrogacy>
```

**Description**: End a surrogacy relationship

**Business Rules**:
- Validate user is participant
- Complete pending moments
- Calculate final statistics
- Update status and timestamps
- Maintain audit trail

---

### Moment Service

**Location**: `src/services/momentService.ts` (planned)

**Purpose**: Schedule and manage surrogacy moments

#### Functions

##### scheduleMoment

```typescript
async function scheduleMoment(
  surrogacyId: string, 
  data: ScheduleMomentData, 
  requestingUserId: string
): Promise<Moment>
```

**Description**: Schedule a new moment for a surrogacy

**Parameters**:
- `surrogacyId`: Surrogacy ID
- `data`: Scheduling details
- `requestingUserId`: User scheduling the moment

**Business Rules**:
- Validate user is participant in surrogacy
- Check surrogacy is active
- Validate time doesn't conflict with existing moments
- Check participant availability
- Apply boundary restrictions
- Send notifications to participants

---

##### getMoment

```typescript
async function getMoment(
  id: string, 
  requestingUserId: string
): Promise<Moment | null>
```

**Description**: Get a moment by ID with permission checks

**Parameters**:
- `id`: Moment ID
- `requestingUserId`: User requesting access

**Business Rules**:
- Validate user is participant
- Check moment status allows viewing
- Apply permission filters

---

##### listUpcomingMoments

```typescript
async function listUpcomingMoments(
  userId: string, 
  limit?: number
): Promise<Moment[]>
```

**Description**: List upcoming moments for a user

**Parameters**:
- `userId`: User ID
- `limit`: Maximum number of moments to return

**Business Rules**:
- Filter for scheduled moments in the future
- Order by scheduled date
- Include moments from all active surrogacies
- Apply availability and boundary filters

---

##### confirmMoment

```typescript
async function confirmMoment(
  momentId: string, 
  userId: string
): Promise<Moment>
```

**Description**: Confirm attendance for a moment

**Business Rules**:
- Validate user is participant
- Check moment is scheduled (not started/completed)
- Add user to confirmed list
- Notify other participants
- Check if all participants confirmed

---

##### cancelMoment

```typescript
async function cancelMoment(
  momentId: string, 
  userId: string, 
  reason?: string
): Promise<Moment>
```

**Description**: Cancel a scheduled moment

**Business Rules**:
- Validate user is participant
- Check moment allows cancellation
- Notify other participants
- Handle token implications (refunds/costs)
- Update surrogacy statistics

---

##### startMoment

```typescript
async function startMoment(
  momentId: string, 
  userId: string
): Promise<Moment>
```

**Description**: Mark a moment as in progress

**Business Rules**:
- Validate user is participant
- Check moment is scheduled
- Update status to 'in-progress'
- Start duration tracking
- Notify participants

---

##### completeMoment

```typescript
async function completeMoment(
  momentId: string, 
  userId: string, 
  actualDuration?: string
): Promise<Exchange>
```

**Description**: Complete a moment and create exchange

**Business Rules**:
- Validate user is participant
- Check moment is in progress
- Create exchange record
- Calculate token transfers
- Update surrogacy statistics
- Trigger feedback requests
- Update status to 'completed'

---

### Exchange Service

**Location**: `src/services/exchangeService.ts` (planned)

**Purpose**: Manage completed exchanges and feedback

#### Functions

##### getExchange

```typescript
async function getExchange(
  id: string, 
  requestingUserId: string
): Promise<Exchange | null>
```

**Description**: Get an exchange by ID with permission checks

**Parameters**:
- `id`: Exchange ID
- `requestingUserId`: User requesting access

**Business Rules**:
- Validate user is participant
- Check exchange status allows viewing
- Apply permission filters

---

##### listExchanges

```typescript
async function listExchanges(
  userId: string, 
  filters: ExchangeFilters
): Promise<Exchange[]>
```

**Description**: List exchanges for a user

**Parameters**:
- `userId`: User ID
- `filters`: Filter criteria

**Filter Options**:
```typescript
interface ExchangeFilters {
  role?: 'provider' | 'receiver' | 'both';
  surrogacyId?: string;
  status?: ExchangeStatus[];
  hasFeedback?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: 'fulfilledAt' | 'duration' | 'rating';
}
```

---

##### recordFeedback

```typescript
async function recordFeedback(
  exchangeId: string, 
  fromUserId: string, 
  feedback: FeedbackData
): Promise<DetailedFeedback>
```

**Description**: Record feedback for a completed exchange

**Parameters**:
- `exchangeId`: Exchange ID
- `fromUserId`: User providing feedback
- `feedback`: Feedback data

**Business Rules**:
- Validate exchange is completed
- Check user hasn't already provided feedback
- Validate feedback ratings are within range
- Update trust matrices for recipient
- Calculate reputation changes
- Update exchange status
- Notify feedback recipient

---

##### getFeedback

```typescript
async function getFeedback(
  exchangeId: string, 
  requestingUserId: string
): Promise<DetailedFeedback | null>
```

**Description**: Get feedback for an exchange

**Business Rules**:
- Validate user is participant
- Check feedback exists
- Apply privacy rules (may anonymize certain feedback)

---

### Proposal Service

**Location**: `src/services/proposalService.ts` (planned)

**Purpose**: Manage surrogacy proposals and negotiations

#### Functions

##### createProposal

```typescript
async function createProposal(
  data: CreateProposalData, 
  proposingUserId: string
): Promise<Proposal>
```

**Description**: Create a new surrogacy proposal

**Parameters**:
- `data`: Proposal details
- `proposingUserId`: User making the proposal

**Business Rules**:
- Validate need exists and is active
- Validate offer exists and has capacity
- Check user hasn't already proposed
- Validate proposal terms are reasonable
- Hold tokens in escrow if required
- Notify need owner

---

##### getProposal

```typescript
async function getProposal(
  id: string, 
  requestingUserId: string
): Promise<Proposal | null>
```

**Description**: Get a proposal by ID with permission checks

**Business Rules**:
- Validate user is proposer or need owner
- Check proposal status allows viewing

---

##### listProposals

```typescript
async function listProposals(
  userId: string, 
  role: 'proposing' | 'receiving', 
  filters: ProposalFilters
): Promise<Proposal[]>
```

**Description**: List proposals for a user

**Parameters**:
- `userId`: User ID
- `role`: User's role in proposals
- `filters`: Filter criteria

**Filter Options**:
```typescript
interface ProposalFilters {
  status?: ProposalStatus[];
  needId?: string;
  offerId?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'status' | 'urgency';
}
```

---

##### acceptProposal

```typescript
async function acceptProposal(
  id: string, 
  acceptingUserId: string, 
  agreementData?: SurrogacyAgreement
): Promise<Surrogacy>
```

**Description**: Accept a proposal and create surrogacy

**Business Rules**:
- Validate user is need owner
- Check proposal is pending
- Validate agreement terms if provided
- Create surrogacy relationship
- Transfer tokens from escrow
- Update proposal status
- Notify proposer

---

##### counterProposal

```typescript
async function counterProposal(
  id: string, 
  counterData: CounterProposalData, 
  counterUserId: string
): Promise<Proposal>
```

**Description**: Counter a proposal with modified terms

**Business Rules**:
- Validate user is participant
- Check proposal allows countering
- Validate counter terms are reasonable
- Create counter proposal or update existing
- Update original proposal status
- Notify other party

---

##### declineProposal

```typescript
async function declineProposal(
  id: string, 
  decliningUserId: string, 
  reason?: string
): Promise<Proposal>
```

**Description**: Decline a proposal

**Business Rules**:
- Validate user is participant
- Check proposal is pending
- Release tokens from escrow
- Update proposal status
- Notify other party with reason

---

##### withdrawProposal

```typescript
async function withdrawProposal(
  id: string, 
  proposingUserId: string
): Promise<Proposal>
```

**Description**: Withdraw a pending proposal

**Business Rules**:
- Validate user is proposer
- Check proposal is pending
- Release tokens from escrow
- Update proposal status
- Notify need owner

---

### Compatibility Service

**Location**: `src/services/compatibilityService.ts` (planned)

**Purpose**: Calculate and analyze compatibility between needs and offers

#### Functions

##### calculateCompatibility

```typescript
async function calculateCompatibility(
  needId: string, 
  offerId: string
): Promise<CompatibilityMatrix>
```

**Description**: Calculate multi-dimensional compatibility between a need and offer

**Returns**: Compatibility matrix with detailed breakdown

**Compatibility Dimensions**:
```typescript
interface CompatibilityDimension {
  name: CompatibilityDimensionType;
  score: number; // 0-100
  weight: number; // 0-1
  factors: string[]; // Explanation of score
}

type CompatibilityDimensionType =
  | 'need-fit'
  | 'availability'
  | 'boundary-fit'
  | 'communication'
  | 'location'
  | 'reliability'
  | 'reciprocity'
  | 'social-energy';
```

**Business Rules**:
- Analyze need description vs offer capabilities
- Compare availability windows
- Check boundary compatibility
- Evaluate communication preferences
- Assess location feasibility
- Incorporate trust/reputation data
- Consider reciprocity potential
- Factor in social energy matching

---

##### getCompatibilityExplanation

```typescript
async function getCompatibilityExplanation(
  matrix: CompatibilityMatrix
): Promise<string>
```

**Description**: Generate human-readable explanation of compatibility

**Returns**: Natural language explanation of compatibility scores and recommendations

---

##### findBestMatches

```typescript
async function findBestMatches(
  needId: string, 
  limit?: number
): Promise<CompatibilityMatch[]>
```

**Description**: Find the best matching offers for a need

**Returns**: Array of compatibility matches sorted by overall score

**Compatibility Match**:
```typescript
interface CompatibilityMatch {
  offerId: string;
  offer: Offer;
  matrix: CompatibilityMatrix;
  explanation: string;
}
```

---

### Permission Service

**Location**: `src/services/permissionService.ts` (planned)

**Purpose**: Manage permissions and capability resolution

#### Functions

##### checkCapability

```typescript
async function checkCapability(
  userId: string, 
  capability: Capability, 
  context?: PermissionContext
): Promise<PermissionResult>
```

**Description**: Check if a user has a specific capability

**Parameters**:
- `userId`: User ID to check
- `capability`: Capability to check
- `context`: Additional context for permission check

**Returns**: Permission result with detailed information

**Permission Result**:
```typescript
interface PermissionResult {
  hasPermission: boolean;
  reason?: string;
  restrictions?: string[];
  expiresAt?: string;
}
```

**Business Rules**:
- Check user role (Public/Member/Admin)
- Validate user account status
- Check rank requirements
- Evaluate specific permission grants
- Apply contextual rules
- Check boundary compliance
- Return detailed reasoning

---

##### grantPermission

```typescript
async function grantPermission(
  grantData: PermissionGrantData
): Promise<PermissionGrant>
```

**Description**: Grant a permission to another user

**Parameters**:
- `grantData`: Permission grant details

**Business Rules**:
- Validate granter has permission to grant
- Check grant is allowed for capability
- Validate recipient exists and is active
- Check for duplicate grants
- Set up expiration if specified
- Create audit trail
- Notify recipient

---

##### revokePermission

```typescript
async function revokePermission(
  grantId: string, 
  revokingUserId: string, 
  reason?: string
): Promise<PermissionGrant>
```

**Description**: Revoke a previously granted permission

**Business Rules**:
- Validate user has permission to revoke
- Check grant exists and is revocable
- Update grant with revocation details
- Create audit trail
- Notify grant recipient

---

##### listUserPermissions

```typescript
async function listUserPermissions(
  userId: string, 
  filter?: PermissionFilter
): Promise<PermissionGrant[]>
```

**Description**: List permissions granted to/from a user

**Parameters**:
- `userId`: User ID
- `filter`: Optional filter criteria

**Filter Options**:
```typescript
interface PermissionFilter {
  direction?: 'granted' | 'received' | 'both';
  capability?: Capability;
  status?: 'active' | 'expired' | 'revoked';
  limit?: number;
}
```

---

### Token Service

**Location**: `src/services/tokenService.ts` (planned)

**Purpose**: Manage token economy and ledger

#### Functions

##### getTokenBalance

```typescript
async function getTokenBalance(userId: string): Promise<TokenBalance>
```

**Description**: Get current token balance for a user

**Returns**: Detailed balance information

**Token Balance**:
```typescript
interface TokenBalance {
  currentBalance: number;
  availableBalance: number; // Excluding held/escrow tokens
  heldBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}
```

---

##### earnTokens

```typescript
async function earnTokens(
  userId: string, 
  amount: number, 
  source: TokenSource, 
  relatedEntityId?: string
): Promise<TokenLedgerEntry>
```

**Description**: Award tokens to a user

**Parameters**:
- `userId`: User receiving tokens
- `amount`: Number of tokens to award
- `source`: Source of tokens
- `relatedEntityId`: Related entity (exchange, achievement, etc.)

**Business Rules**:
- Validate user exists and is active
- Check amount is positive and reasonable
- Validate source is legitimate
- Apply anti-farming rules
- Create ledger entry
- Update user balance
- Trigger notifications

---

##### spendTokens

```typescript
async function spendTokens(
  userId: string, 
  amount: number, 
  destination: TokenDestination, 
  relatedEntityId?: string
): Promise<TokenLedgerEntry>
```

**Description**: Spend tokens from a user's balance

**Parameters**:
- `userId`: User spending tokens
- `amount`: Number of tokens to spend
- `destination`: What tokens are spent on
- `relatedEntityId**: Related entity (need, offer, etc.)

**Business Rules**:
- Validate user exists and is active
- Check user has sufficient balance
- Validate amount is positive and reasonable
- Validate destination is allowed
- Apply spending limits if applicable
- Create ledger entry
- Update user balance
- Trigger notifications

---

##### transferTokens

```typescript
async function transferTokens(
  fromUserId: string, 
  toUserId: string, 
  amount: number, 
  reason?: string
): Promise<TokenLedgerEntry[]>
```

**Description**: Transfer tokens between users

**Business Rules**:
- Validate both users exist and are active
- Check sender has sufficient balance
- Validate transfer is allowed
- Apply transfer limits
- Create ledger entries for both users
- Update both balances
- Notify both users

---

##### holdTokens

```typescript
async function holdTokens(
  userId: string, 
  amount: number, 
  reason: string, 
  relatedEntityId: string
): Promise<TokenHold>
```

**Description**: Hold tokens in escrow

**Business Rules**:
- Validate user has sufficient available balance
- Create token hold record
- Update available balance
- Set expiration for hold

**Token Hold**:
```typescript
interface TokenHold {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  relatedEntityId: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'released' | 'forfeited';
}
```

---

##### releaseTokens

```typescript
async function releaseTokens(
  holdId: string, 
  recipientUserId?: string
): Promise<void>
```

**Description**: Release held tokens

**Parameters**:
- `holdId`: Token hold ID
- `recipientUserId`: Optional recipient (if not original holder)

**Business Rules**:
- Validate hold exists and is active
- Release tokens to appropriate recipient
- Update hold status
- Update user balances

---

##### getTokenHistory

```typescript
async function getTokenHistory(
  userId: string, 
  filters: TokenHistoryFilters
): Promise<TokenLedgerEntry[]>
```

**Description**: Get token transaction history

**Filter Options**:
```typescript
interface TokenHistoryFilters {
  type?: TokenTransactionType[];
  source?: TokenSource[];
  destination?: TokenDestination[];
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
```

---

### User Progression Service

**Location**: `src/services/userProgressionService.ts` (planned)

**Purpose**: Manage user XP, ranks, and capabilities

#### Functions

##### getUserProgression

```typescript
async function getUserProgression(userId: string): Promise<UserProgression>
```

**Description**: Get complete user progression data

**Returns**: User progression including XP, rank, capabilities, and statistics

---

##### awardXP

```typescript
async function awardXP(
  userId: string, 
  amount: number, 
  source: XPSource, 
  relatedEntityId?: string
): Promise<UserProgression>
```

**Description**: Award XP to a user

**Parameters**:
- `userId`: User receiving XP
- `amount`: XP to award
- `source`: Source of XP
- `relatedEntityId**: Related entity (exchange, achievement, etc.)

**Business Rules**:
- Validate user exists and is active
- Check amount is positive and reasonable
- Apply anti-farming rules
- Check for level up
- Unlock new capabilities if applicable
- Update progression data
- Trigger notifications

**XP Sources**:
```typescript
type XPSource =
  | 'profile-completion'
  | 'exchange-completion'
  | 'positive-feedback'
  | 'streak-maintenance'
  | 'achievement'
  | 'milestone'
  | 'community-contribution';
```

---

##### checkRankRequirements

```typescript
async function checkRankRequirements(
  userId: string, 
  targetLevel: number
): Promise<RankCheckResult>
```

**Description**: Check if user meets requirements for a rank

**Returns**: Detailed rank check results

**Rank Check Result**:
```typescript
interface RankCheckResult {
  meetsRequirements: boolean;
  currentLevel: number;
  targetLevel: number;
  requirements: RankRequirements;
  currentProgress: RequirementProgress;
  missingRequirements: string[];
  estimatedTimeToLevel?: string;
}

interface RequirementProgress {
  profileCompletion: number;
  accountAge: number;
  completedExchanges: number;
  trustScore: number;
  hasNoRestrictions: boolean;
}
```

---

##### checkCapability

```typescript
async function checkCapability(
  userId: string, 
  capability: Capability
): Promise<CapabilityCheckResult>
```

**Description**: Check if user has access to a capability

**Returns**: Capability access information

**Capability Check Result**:
```typescript
interface CapabilityCheckResult {
  hasAccess: boolean;
  reason?: string;
  requiredLevel?: number;
  currentLevel?: number;
  alternativeCapabilities?: Capability[];
}
```

---

##### updateStreak

```typescript
async function updateStreak(userId: string): Promise<UserProgression>
```

**Description**: Update user activity streak

**Business Rules**:
- Check if user has activity today
- Update streak count
- Handle streak resets
- Award streak achievements
- Update progression data

---

### Feedback Service

**Location**: `src/services/feedbackService.ts` (planned)

**Purpose**: Manage feedback and trust matrix calculations

#### Functions

##### calculateTrustMatrix

```typescript
async function calculateTrustMatrix(
  userId: string, 
  offerId?: string
): Promise<TrustMatrix>
```

**Description**: Calculate trust matrix for a user or offer

**Parameters**:
- `userId`: User ID
- `offerId`: Optional offer ID for offer-specific trust

**Business Rules**:
- Aggregate all feedback for user/offer
- Calculate dimensional scores
- Apply weighting factors
- Calculate trend analysis
- Update historical averages
- Return comprehensive trust matrix

---

##### getTrustMatrix

```typescript
async function getTrustMatrix(
  userId: string, 
  offerId?: string
): Promise<TrustMatrix | null>
```

**Description**: Get cached trust matrix or calculate if needed

---

##### recordFeedback

```typescript
async function recordFeedback(
  feedback: DetailedFeedback
): Promise<DetailedFeedback>
```

**Description**: Record feedback and update trust matrices

**Business Rules**:
- Validate feedback data
- Check user hasn't already provided feedback for exchange
- Store feedback record
- Recalculate trust matrix for feedback recipient
- Update offer-specific trust if applicable
- Trigger notifications
- Check for moderation review

---

##### listUserFeedback

```typescript
async function listUserFeedback(
  userId: string, 
  role: 'given' | 'received', 
  filters?: FeedbackFilters
): Promise<DetailedFeedback[]>
```

**Description**: List feedback given to or received by a user

**Filter Options**:
```typescript
interface FeedbackFilters {
  offerId?: string;
  minRating?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
```

---

### Admin Service

**Location**: `src/services/adminService.ts` (planned)

**Purpose**: Administrative operations and oversight

#### Functions

##### lookupMember

```typescript
async function lookupMember(
  adminId: string, 
  query: MemberQuery
): Promise<MemberLookupResult[]>
```

**Description**: Search for members with various criteria

**Parameters**:
- `adminId`: Admin ID making the request
- `query`: Search criteria

**Member Query**:
```typescript
interface MemberQuery {
  userId?: string;
  email?: string;
  name?: string;
  status?: MemberStatus[];
  rankRange?: [number, number];
  tokenBalanceRange?: [number, number];
  limit?: number;
}
```

**Business Rules**:
- Validate requester has admin permissions
- Apply appropriate filters
- Return limited member information
- Create audit log entry

---

##### inspectNeeds

```typescript
async function inspectNeeds(
  adminId: string, 
  filters: NeedInspectionFilters
): Promise<Need[]>
```

**Description**: Inspect needs with admin-level access

**Business Rules**:
- Validate requester has admin permissions
- Apply filters
- Return full need information (including private fields)
- Create audit log entry

---

##### inspectOffers

```typescript
async function inspectOffers(
  adminId: string, 
  filters: OfferInspectionFilters
): Promise<Offer[]>
```

**Description**: Inspect offers with admin-level access

**Business Rules**:
- Validate requester has admin permissions
- Apply filters
- Return full offer information
- Create audit log entry

---

##### inspectSurrogacies

```typescript
async function inspectSurrogacies(
  adminId: string, 
  filters: SurrogacyInspectionFilters
): Promise<Surrogacy[]>
```

**Description**: Inspect surrogacies with admin-level access

**Business Rules**:
- Validate requester has admin permissions
- Apply filters
- Return full surrogacy information
- Create audit log entry

---

##### inspectFeedback

```typescript
async function inspectFeedback(
  adminId: string, 
  filters: FeedbackInspectionFilters
): Promise<DetailedFeedback[]>
```

**Description**: Inspect feedback with admin-level access

**Business Rules**:
- Validate requester has admin permissions
- Apply filters
- Return full feedback information
- Create audit log entry

---

##### moderateMedia

```typescript
async function moderateMedia(
  adminId: string, 
  mediaId: string, 
  action: ModerationAction, 
  reason?: string
): Promise<MediaAsset>
```

**Description**: Moderate media content

**Parameters**:
- `adminId`: Admin ID
- `mediaId`: Media ID to moderate
- `action`: Moderation action to take
- `reason`: Reason for moderation

**Moderation Actions**:
```typescript
type ModerationAction = 'approve' | 'reject' | 'flag' | 'remove';
```

**Business Rules**:
- Validate requester has admin permissions
- Update media moderation status
- Notify media owner if applicable
- Create audit log entry

---

##### inspectTokenLedger

```typescript
async function inspectTokenLedger(
  adminId: string, 
  filters: TokenLedgerFilters
): Promise<TokenLedgerEntry[]>
```

**Description**: Inspect token ledger entries

**Business Rules**:
- Validate requester has admin permissions
- Apply filters
- Return ledger entries
- Create audit log entry

---

##### inspectUserProgression

```typescript
async function inspectUserProgression(
  adminId: string, 
  userId: string
): Promise<UserProgression>
```

**Description**: Inspect user progression data

**Business Rules**:
- Validate requester has admin permissions
- Return full progression information
- Create audit log entry

---

##### handleReport

```typescript
async function handleReport(
  adminId: string, 
  reportId: string, 
  action: ReportAction, 
  notes?: string
): Promise<Report>
```

**Description**: Handle user reports

**Parameters**:
- `adminId`: Admin ID
- `reportId`: Report ID
- `action`: Action to take on report
- `notes**: Admin notes

**Report Actions**:
```typescript
type ReportAction = 
  | 'investigate'
  | 'resolve-no-action'
  | 'warn-user'
  | 'restrict-user'
  | 'suspend-user'
  | 'ban-user'
  | 'escalate';
```

**Business Rules**:
- Validate requester has admin permissions
- Update report status
- Take appropriate action on reported user
- Create audit log entry
- Notify affected parties

---

##### getAuditLog

```typescript
async function getAuditLog(
  adminId: string, 
  filters: AuditLogFilters
): Promise<AuditLogEntry[]>
```

**Description**: Get audit log entries

**Business Rules**:
- Validate requester has admin permissions
- Apply filters
- Return audit log entries
- Create audit log entry for this access

---

## Server Actions Pattern

### Current Pattern

```typescript
'use server';

export async function handleTagsFinalized(tags: string[]) {
  console.log("Finalized tags (server-side):", tags);
  // Server-side logic here
}
```

### Planned Pattern

```typescript
'use server';

import { z } from 'zod';

// Define input schema
const CreateProposalSchema = z.object({
  needId: z.string(),
  offerId: z.string(),
  message: z.string().min(10).max(500),
});

// Server action with validation
export async function createProposalAction(data: unknown) {
  try {
    // Validate input
    const validatedData = CreateProposalSchema.parse(data);
    
    // Get current user (from auth)
    const userId = await getCurrentUserId();
    
    // Call service layer
    const proposal = await proposalService.createProposal(
      validatedData,
      userId
    );
    
    // Return result
    return { success: true, proposal };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, error: error.message };
  }
}
```

## Error Handling Pattern

### Service Layer Errors

```typescript
// Custom error types
class ValidationError extends Error {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`);
    this.name = 'NotFoundError';
  }
}

class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

// Usage in services
export async function getProfile(id: string): Promise<Profile> {
  const profile = await fetchProfileById(id);
  if (!profile) {
    throw new NotFoundError('Profile', id);
  }
  return profile;
}
```

### Component Error Handling

```typescript
// React component error handling
try {
  const profile = await getProfile(userId);
  setProfile(profile);
} catch (error) {
  if (error instanceof NotFoundError) {
    toast.error('Profile not found');
  } else if (error instanceof PermissionError) {
    toast.error('You do not have permission to view this profile');
  } else {
    toast.error('An error occurred while loading the profile');
  }
}
```

## API Usage Examples

### Creating a Need

```typescript
// Client component
import { createNeedAction } from '@/app/actions/needs';

export function NeedCreator() {
  async function handleSubmit(formData: FormData) {
    const result = await createNeedAction({
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      urgency: 'important',
    });
    
    if (result.success) {
      toast.success('Need created successfully');
      router.push(`/needs/${result.need.id}`);
    } else {
      toast.error(result.error);
    }
  }
  
  return (
    <form action={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Fetching User Surrogacies

```typescript
// Server component or service call
import { listUserSurrogacies } from '@/services/surrogacyService';

export async function UserSurrogaciesList({ userId }: { userId: string }) {
  const surrogacies = await listUserSurrogacies(userId, {
    status: ['active'],
    orderBy: 'lastActivity',
  });
  
  return (
    <div>
      {surrogacies.map(surrogacy => (
        <SurrogacyCard key={surrogacy.id} surrogacy={surrogacy} />
      ))}
    </div>
  );
}
```

### Checking Permissions

```typescript
// Permission check before action
import { checkCapability } from '@/services/permissionService';

export async function ProtectedAction({ userId, capability }: Props) {
  const permission = await checkCapability(userId, capability);
  
  if (!permission.hasPermission) {
    return <div>{permission.reason}</div>;
  }
  
  return <ActionComponent />;
}
```

---

**API Reference Version**: 1.0
**Last Updated**: 2025-08-16
**Maintained By**: Surrogate Network Development Team