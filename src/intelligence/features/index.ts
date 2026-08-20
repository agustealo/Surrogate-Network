// Feature snapshot contracts for SC-00.5 Intelligence Readiness
// Provides consistent feature extraction infrastructure for ML models

// Feature snapshot structure
export interface FeatureSnapshot {
  id: string;
  subjectType: 'user' | 'need' | 'offer' | 'proposal' | 'surrogacy';
  subjectId: string;
  featureSet: string; // e.g., 'compatibility@v1', 'proposal-success@v1'
  featureVersion: string; // e.g., '1.0.0'
  features: Record<string, any>;
  capturedAt: Date;
  asOf?: Date; // For historical snapshots
  predictionId?: string; // If this snapshot was used for a prediction
}

// Feature set definitions
export enum FeatureSet {
  COMPATIBILITY_V1 = 'compatibility@v1',
  PROPOSAL_SUCCESS_V1 = 'proposal-success@v1',
  SURROGACY_RISK_V1 = 'surrogacy-risk@v1',
  RECOMMENDATION_RANKER_V1 = 'recommendation-ranker@v1',
  USER_ENGAGEMENT_V1 = 'user-engagement@v1',
  TRUST_SCORE_V1 = 'trust-score@v1',
}

// Compatibility feature set (for Need-Offer matching)
export interface CompatibilityFeatures {
  // Boundary compatibility
  boundaryMatchScore: number; // 0-1, based on overlapping boundaries
  boundaryViolationRisk: number; // 0-1, risk of boundary conflicts
  
  // Location compatibility
  locationMatchScore: number; // 0-1, location mode compatibility
  distanceScore?: number; // 0-1, geographic proximity (if applicable)
  
  // Category alignment
  categoryMatchScore: number; // 0-1, category compatibility
  categoryAlignment: 'exact' | 'related' | 'different';
  
  // Availability alignment
  availabilityOverlap: number; // 0-1, timing overlap score
  timingFlexibility: number; // 0-1, flexibility in scheduling
  
  // Capacity considerations
  capacityUtilization: number; // 0-1, current vs max capacity
  capacityAlignment: number; // 0-1, capacity needs matching
  
  // Social signals
  priorInteractionCount: number; // Number of previous interactions
  averagePriorRating: number; // Average rating from prior interactions
  mutualConnections: number; // Number of shared connections
  
  // Reputation signals
  proposerReputationScore: number; // 0-1, overall reputation
  receiverReputationScore: number; // 0-1, overall reputation
  trustDisparity: number; // 0-1, difference in trust scores
  
  // Historical success signals
  proposalAcceptanceRate: number; // 0-1, historical acceptance rate
  surrogacyCompletionRate: number; // 0-1, historical completion rate
  averageSurrogacyDuration: number; // milliseconds
}

// Proposal success feature set
export interface ProposalSuccessFeatures {
  // Timing factors
  timeSinceNeedCreated: number; // milliseconds
  timeSinceOfferCreated: number; // milliseconds
  responseTimeWindow: number; // milliseconds, typical response time
  
  // Engagement factors
  proposerActivityLevel: number; // 0-1, recent activity
  receiverActivityLevel: number; // 0-1, recent activity
  mutualInterestScore: number; // 0-1, bidirectional interest signals
  
  // Compatibility summary
  boundaryCompatibility: number; // 0-1
  locationCompatibility: number; // 0-1
  timingCompatibility: number; // 0-1
  capacityCompatibility: number; // 0-1
  
  // Content quality
  proposalMessageLength: number; // character count
  proposalMessageQuality: number; // 0-1, subjective quality score
  offerDescriptionQuality: number; // 0-1
  needDescriptionQuality: number; // 0-1
  
  // Risk factors
  newParticipantRisk: number; // 0-1, risk for new users
  boundaryConflictRisk: number; // 0-1, potential boundary issues
  schedulingRisk: number; // 0-1, scheduling complexity
  
  // Historical patterns
  proposerHistoricalAcceptance: number; // 0-1
  receiverHistoricalAcceptance: number; // 0-1
  mutualHistoricalSuccess: number; // 0-1
}

// Surrogacy risk feature set
export interface SurrogacyRiskFeatures {
  // Participant factors
  participantExperienceDisparity: number; // 0-1, experience gap
  participantReputationAlignment: number; // 0-1, reputation similarity
  participantCommunicationStyle: 'aligned' | 'divergent' | 'unknown';
  
  // Agreement factors
  boundaryClarityScore: number; // 0-1, how clear are boundaries
  expectationAlignmentScore: number; // 0-1, expectation matching
  agreementComplexity: number; // 0-1, complexity level
  
  // Relationship factors
  priorRelationshipHistory: number; // 0-1, quality of prior interactions
  relationshipDuration: number; // milliseconds so far
  conflictIncidents: number; // number of conflicts
  
  // External factors
  timingStressFactors: number; // 0-1, scheduling pressure
  environmentalStability: number; // 0-1, life stability indicators
  
  // Engagement quality
  communicationFrequency: number; // messages per day
  communicationQuality: number; // 0-1, subjective quality
  milestoneCompletionRate: number; // 0-1, planned vs actual
  
  // Warning signs
  boundaryViolationRisks: number; // 0-1, potential boundary issues
  communicationGaps: number; // 0-1, frequency of gaps
  commitmentConcerns: number; // 0-1, commitment level concerns
}

// User engagement feature set
export interface UserEngagementFeatures {
  // Activity patterns
  dailyActiveMinutes: number;
  weeklyActiveDays: number;
  sessionDuration: number; // average session length
  activityConsistency: number; // 0-1, consistency score
  
  // Interaction patterns
  profilesViewedPerWeek: number;
  searchesPerformedPerWeek: number;
  proposalsSentPerWeek: number;
  proposalsReceivedPerWeek: number;
  responseTimeAverage: number; // milliseconds
  
  // Content creation
  needsCreatedCount: number;
  offersCreatedCount: number;
  contentUpdateFrequency: number; // updates per week
  
  // Relationship building
  activeSurrogacies: number;
  completedSurrogacies: number;
  averageSurrogacyDuration: number; // milliseconds
  
  // Community engagement
  feedbackGiven: number;
  feedbackReceived: number;
  reportsSubmitted: number;
  helpfulActionsCount: number;
  
  // Platform adoption
  featuresUsed: string[];
  featureAdoptionRate: number; // 0-1, features tried / available features
  powerUserSignals: number; // 0-1, advanced usage indicators
  
  // Retention indicators
  daySinceFirstActivity: number;
  daySinceLastActivity: number;
  churnRiskScore: number; // 0-1, predicted churn risk
}

// Feature snapshot repository interface
export interface FeatureSnapshotRepository {
  capture(snapshot: Omit<FeatureSnapshot, 'id' | 'capturedAt'>): Promise<string>;
  getById(id: string): Promise<FeatureSnapshot | null>;
  getBySubject(subjectType: string, subjectId: string, limit?: number): Promise<FeatureSnapshot[]>;
  getByFeatureSet(featureSet: string, limit?: number): Promise<FeatureSnapshot[]>;
  getHistoricalSnapshots(subjectType: string, subjectId: string, asOf: Date): Promise<FeatureSnapshot[]>;
}

// Feature builder interface
export interface FeatureBuilder<TFeatures = Record<string, any>> {
  buildFeatures(subjectType: string, subjectId: string): Promise<TFeatures>;
  getFeatureSet(): string;
  getFeatureVersion(): string;
}

// Compatibility feature builder
export interface CompatibilityFeatureBuilder extends FeatureBuilder<CompatibilityFeatures> {
  buildForMatching(needId: string, offerId: string): Promise<CompatibilityFeatures>;
  buildForUser(userId: string, targetUserId: string): Promise<CompatibilityFeatures>;
}

// Feature snapshot factory
export class FeatureSnapshotFactory {
  static createCompatibilitySnapshot(
    subjectType: 'need' | 'offer' | 'user',
    subjectId: string,
    features: CompatibilityFeatures,
    asOf?: Date
  ): Omit<FeatureSnapshot, 'id' | 'capturedAt'> {
    return {
      subjectType,
      subjectId,
      featureSet: FeatureSet.COMPATIBILITY_V1,
      featureVersion: '1.0.0',
      features,
      asOf,
    };
  }

  static createProposalSuccessSnapshot(
    subjectId: string,
    features: ProposalSuccessFeatures,
    asOf?: Date
  ): Omit<FeatureSnapshot, 'id' | 'capturedAt'> {
    return {
      subjectType: 'proposal',
      subjectId,
      featureSet: FeatureSet.PROPOSAL_SUCCESS_V1,
      featureVersion: '1.0.0',
      features,
      asOf,
    };
  }

  static createSurrogacyRiskSnapshot(
    subjectId: string,
    features: SurrogacyRiskFeatures,
    asOf?: Date
  ): Omit<FeatureSnapshot, 'id' | 'capturedAt'> {
    return {
      subjectType: 'surrogacy',
      subjectId,
      featureSet: FeatureSet.SURROGACY_RISK_V1,
      featureVersion: '1.0.0',
      features,
      asOf,
    };
  }

  static createUserEngagementSnapshot(
    subjectId: string,
    features: UserEngagementFeatures,
    asOf?: Date
  ): Omit<FeatureSnapshot, 'id' | 'capturedAt'> {
    return {
      subjectType: 'user',
      subjectId,
      featureSet: FeatureSet.USER_ENGAGEMENT_V1,
      featureVersion: '1.0.0',
      features,
      asOf,
    };
  }
}