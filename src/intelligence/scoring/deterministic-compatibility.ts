// Deterministic compatibility baseline scoring for SC-00.5
// Provides a rule-based benchmark that ML models must beat to be worth deploying

import type {
  PredictionResult,
  PredictionScorer,
} from '../predictions';
import { ModelId, PredictionFactory, PredictionType } from '../predictions';
import type { Need, Offer, Profile } from '@/domain/types';
import type { Boundary, SurrogateCategory } from '@/domain/types';
import type { CompatibilityFeatures } from '../features';

// Scoring weights (adjustable based on business priorities)
const SCORING_WEIGHTS = {
  boundaryCompatibility: 0.25,
  locationCompatibility: 0.20,
  categoryAlignment: 0.15,
  availabilityOverlap: 0.15,
  capacityAlignment: 0.10,
  reputationAlignment: 0.10,
  priorInteractions: 0.05,
} as const;

// Minimum thresholds for eligibility
const ELIGIBILITY_THRESHOLDS = {
  minimumBoundaryMatch: 0.3,
  minimumLocationMatch: 0.0,
  minimumCategoryMatch: 0.0,
  minimumReputation: 0.2, // Both parties must have at least this reputation
  maximumBoundaryViolationRisk: 0.7,
} as const;

// Reason codes for explanation
export const COMPATIBILITY_REASON_CODES = {
  PERFECT_BOUNDARY_MATCH: 'perfect_boundary_match',
  GOOD_BOUNDARY_MATCH: 'good_boundary_match',
  BOUNDARY_MISMATCH: 'boundary_mismatch',
  PERFECT_LOCATION_MATCH: 'perfect_location_match',
  GOOD_LOCATION_MATCH: 'good_location_match',
  LOCATION_MISMATCH: 'location_mismatch',
  EXACT_CATEGORY_MATCH: 'exact_category_match',
  RELATED_CATEGORY_MATCH: 'related_category_match',
  DIFFERENT_CATEGORY: 'different_category',
  HIGH_AVAILABILITY_OVERLAP: 'high_availability_overlap',
  GOOD_CAPACITY_ALIGNMENT: 'good_capacity_alignment',
  LOW_CAPACITY: 'low_capacity',
  STRONG_REPUTATION_ALIGNMENT: 'strong_reputation_alignment',
  WEAK_REPUTATION: 'weak_reputation',
  PRIOR_POSITIVE_INTERACTIONS: 'prior_positive_interactions',
  NO_PRIOR_INTERACTIONS: 'no_prior_interactions',
  HIGH_BOUNDARY_VIOLATION_RISK: 'high_boundary_violation_risk',
} as const;

// Category compatibility mapping
const CATEGORY_COMPATIBILITY: Record<SurrogateCategory, SurrogateCategory[]> = {
  personal: ['personal', 'casual'],
  utilitarian_business: ['utilitarian_business'],
  casual: ['casual', 'personal'],
};

// Deterministic compatibility scorer
export class DeterministicCompatibilityScorer implements PredictionScorer {
  getModelInfo() {
    return {
      id: ModelId.BASELINE_COMPATIBILITY,
      version: '1.0.0',
      type: PredictionType.COMPATIBILITY_SCORE,
    };
  }

  async score(context: {
    need: Need;
    offer: Offer;
    needOwner: Profile;
    offerOwner: Profile;
  }): Promise<PredictionResult> {
    const features = await this.buildFeatures(context);
    const score = this.calculateScore(features);
    const confidence = this.calculateConfidence(features);
    const reasonCodes = this.generateReasonCodes(features, score);
    const eligible = this.determineEligibility(features, score);

    // Create prediction (without actual DB persistence for now)
    const prediction = PredictionFactory.createCompatibilityPrediction(
      context.need.id,
      'feature-snapshot-placeholder', // Will be replaced with actual snapshot ID
      score,
      confidence,
      reasonCodes,
      {
        needId: context.need.id,
        offerId: context.offer.id,
        needOwnerId: context.needOwner.id,
        offerOwnerId: context.offerOwner.id,
        scoringFactors: {
          boundaryCompatibility: features.boundaryMatchScore,
          locationCompatibility: features.locationMatchScore,
          categoryAlignment: features.categoryMatchScore,
          availabilityOverlap: features.availabilityOverlap,
          capacityAlignment: features.capacityAlignment,
          reputationAlignment:
            (features.proposerReputationScore + features.receiverReputationScore) / 2,
        },
      }
    );

    return {
      predictionId: 'prediction-placeholder', // Will be replaced with actual prediction ID
      score,
      confidence,
      eligible,
      reasonCodes,
      featureSnapshotId: 'feature-snapshot-placeholder',
      modelUsed: this.getModelInfo(),
      createdAt: new Date(),
    };
  }

  private async buildFeatures(context: {
    need: Need;
    offer: Offer;
    needOwner: Profile;
    offerOwner: Profile;
  }): Promise<CompatibilityFeatures> {
    const { need, offer, needOwner, offerOwner } = context;

    return {
      // Boundary compatibility
      boundaryMatchScore: this.calculateBoundaryCompatibility(need.boundaries, offer.boundaries),
      boundaryViolationRisk: this.calculateBoundaryViolationRisk(need.boundaries, offer.boundaries),

      // Location compatibility
      locationMatchScore: this.calculateLocationCompatibility(need.locationMode, offer.locationMode),

      // Category alignment
      categoryMatchScore: this.calculateCategoryAlignment(need.category, offer.category),
      categoryAlignment: this.getCategoryAlignmentType(need.category, offer.category),

      // Availability alignment
      availabilityOverlap: this.calculateAvailabilityOverlap(need.timing, offer.timing),
      timingFlexibility: 0.8, // Default assumption

      // Capacity considerations
      capacityUtilization: this.calculateCapacityUtilization(offer),
      capacityAlignment: this.calculateCapacityAlignment(need, offer),

      // Social signals
      priorInteractionCount: 0, // Would require interaction history
      averagePriorRating: 0, // Would require interaction history
      mutualConnections: 0, // Would require connection graph

      // Reputation signals
      proposerReputationScore: this.calculateReputationScore(offerOwner),
      receiverReputationScore: this.calculateReputationScore(needOwner),
      trustDisparity: Math.abs(this.calculateReputationScore(offerOwner) - this.calculateReputationScore(needOwner)),

      // Historical success signals
      proposalAcceptanceRate: 0.7, // Default assumption
      surrogacyCompletionRate: 0.8, // Default assumption
      averageSurrogacyDuration: 3600000, // Default: 1 hour
    };
  }

  private calculateBoundaryCompatibility(needBoundaries: Boundary[], offerBoundaries: Boundary[]): number {
    if (!needBoundaries?.length || !offerBoundaries?.length) return 0.5;

    const needSet = new Set(needBoundaries);
    const offerSet = new Set(offerBoundaries);

    // Count matching boundaries
    const matches = [...needSet].filter(b => offerSet.has(b)).length;
    const totalPossible = Math.max(needSet.size, offerSet.size);

    if (totalPossible === 0) return 0.5;

    return matches / totalPossible;
  }

  private calculateBoundaryViolationRisk(needBoundaries: Boundary[], offerBoundaries: Boundary[]): number {
    // High risk if one has strict boundaries and other doesn't
    if (!needBoundaries?.length || !offerBoundaries?.length) return 0.3;

    const strictBoundaries = ['physical', 'romantic'];
    const needHasStrict = needBoundaries.some(b => strictBoundaries.includes(b));
    const offerHasStrict = offerBoundaries.some(b => strictBoundaries.includes(b));

    // Risk is higher if only one party has strict boundaries
    if (needHasStrict !== offerHasStrict) {
      return 0.7;
    }

    // Risk is lower if both or neither have strict boundaries
    return 0.2;
  }

  private calculateLocationCompatibility(needLocation: string, offerLocation: string): number {
    if (needLocation === offerLocation) return 1.0;
    if (needLocation === 'either' || offerLocation === 'either') return 0.8;
    return 0.3;
  }

  private calculateCategoryAlignment(needCategory: SurrogateCategory, offerCategory: SurrogateCategory): number {
    if (needCategory === offerCategory) return 1.0;
    if (CATEGORY_COMPATIBILITY[needCategory]?.includes(offerCategory)) return 0.7;
    return 0.3;
  }

  private getCategoryAlignmentType(needCategory: SurrogateCategory, offerCategory: SurrogateCategory): 'exact' | 'related' | 'different' {
    if (needCategory === offerCategory) return 'exact';
    if (CATEGORY_COMPATIBILITY[needCategory]?.includes(offerCategory)) return 'related';
    return 'different';
  }

  private calculateAvailabilityOverlap(needTiming: string | undefined, offerTiming: string | undefined): number {
    // Simplified logic - would need actual scheduling data
    if (!needTiming && !offerTiming) return 0.7; // Both flexible
    if (needTiming && offerTiming) return 0.8; // Both specified
    return 0.6; // One specified, one flexible
  }

  private calculateCapacityUtilization(offer: Offer): number {
    const current = offer.currentCapacity ?? 0;
    const capacity = offer.capacity ?? 0;
    if (capacity === 0) return 0.5;
    return Math.min(current / capacity, 1.0);
  }

  private calculateCapacityAlignment(need: Need, offer: Offer): number {
    const current = offer.currentCapacity ?? 0;
    const capacity = offer.capacity ?? 0;
    // Needs don't have capacity, so this is about offer availability
    if (capacity === 0) return 1.0;
    if (current >= capacity) return 0.0;
    return (capacity - current) / capacity;
  }

  private calculateReputationScore(profile: Profile): number {
    // Simple reputation scoring based on available data
    const rank = profile.rank || 1;
    const xp = profile.xp || 0;
    const tokenBalance = profile.tokenBalance || 0;

    // Weighted combination
    const xpWeight = 0.4;
    const rankWeight = 0.3;
    const tokenWeight = 0.3;

    // Normalize XP (assuming max reasonable XP is 10000)
    const normalizedXp = Math.min(xp / 10000, 1.0);

    // Normalize rank (assuming max rank is 10)
    const normalizedRank = Math.min(rank / 10, 1.0);

    // Normalize tokens (assuming max reasonable is 1000)
    const normalizedTokens = Math.min(tokenBalance / 1000, 1.0);

    return (
      xpWeight * normalizedXp +
      rankWeight * normalizedRank +
      tokenWeight * normalizedTokens
    );
  }

  private calculateScore(features: CompatibilityFeatures): number {
    return (
      SCORING_WEIGHTS.boundaryCompatibility * features.boundaryMatchScore +
      SCORING_WEIGHTS.locationCompatibility * features.locationMatchScore +
      SCORING_WEIGHTS.categoryAlignment * features.categoryMatchScore +
      SCORING_WEIGHTS.availabilityOverlap * features.availabilityOverlap +
      SCORING_WEIGHTS.capacityAlignment * features.capacityAlignment +
      SCORING_WEIGHTS.reputationAlignment *
        ((features.proposerReputationScore + features.receiverReputationScore) / 2) +
      SCORING_WEIGHTS.priorInteractions * Math.min(features.priorInteractionCount / 5, 1.0)
    );
  }

  private calculateConfidence(features: CompatibilityFeatures): number {
    // Confidence is higher when we have more complete data
    let confidenceFactors = 0;
    let totalFactors = 0;

    // Boundary match confidence
    if (features.boundaryMatchScore > 0.7) confidenceFactors += 1;
    totalFactors += 1;

    // Location match confidence
    if (features.locationMatchScore > 0.7) confidenceFactors += 1;
    totalFactors += 1;

    // Category match confidence
    if (features.categoryMatchScore > 0.7) confidenceFactors += 1;
    totalFactors += 1;

    // Reputation confidence
    if (features.proposerReputationScore > 0.5 && features.receiverReputationScore > 0.5) {
      confidenceFactors += 1;
    }
    totalFactors += 1;

    return confidenceFactors / totalFactors;
  }

  private generateReasonCodes(features: CompatibilityFeatures, score: number): string[] {
    const reasons: string[] = [];

    // Boundary reasons
    if (features.boundaryMatchScore >= 0.9) {
      reasons.push(COMPATIBILITY_REASON_CODES.PERFECT_BOUNDARY_MATCH);
    } else if (features.boundaryMatchScore >= 0.6) {
      reasons.push(COMPATIBILITY_REASON_CODES.GOOD_BOUNDARY_MATCH);
    } else {
      reasons.push(COMPATIBILITY_REASON_CODES.BOUNDARY_MISMATCH);
    }

    // Location reasons
    if (features.locationMatchScore >= 0.9) {
      reasons.push(COMPATIBILITY_REASON_CODES.PERFECT_LOCATION_MATCH);
    } else if (features.locationMatchScore >= 0.6) {
      reasons.push(COMPATIBILITY_REASON_CODES.GOOD_LOCATION_MATCH);
    } else {
      reasons.push(COMPATIBILITY_REASON_CODES.LOCATION_MISMATCH);
    }

    // Category reasons
    if (features.categoryAlignment === 'exact') {
      reasons.push(COMPATIBILITY_REASON_CODES.EXACT_CATEGORY_MATCH);
    } else if (features.categoryAlignment === 'related') {
      reasons.push(COMPATIBILITY_REASON_CODES.RELATED_CATEGORY_MATCH);
    } else {
      reasons.push(COMPATIBILITY_REASON_CODES.DIFFERENT_CATEGORY);
    }

    // Availability reasons
    if (features.availabilityOverlap >= 0.7) {
      reasons.push(COMPATIBILITY_REASON_CODES.HIGH_AVAILABILITY_OVERLAP);
    }

    // Capacity reasons
    if (features.capacityAlignment >= 0.7) {
      reasons.push(COMPATIBILITY_REASON_CODES.GOOD_CAPACITY_ALIGNMENT);
    } else if (features.capacityUtilization >= 0.9) {
      reasons.push(COMPATIBILITY_REASON_CODES.LOW_CAPACITY);
    }

    // Reputation reasons
    if (
      features.proposerReputationScore >= 0.7 &&
      features.receiverReputationScore >= 0.7
    ) {
      reasons.push(COMPATIBILITY_REASON_CODES.STRONG_REPUTATION_ALIGNMENT);
    } else if (
      features.proposerReputationScore < 0.3 ||
      features.receiverReputationScore < 0.3
    ) {
      reasons.push(COMPATIBILITY_REASON_CODES.WEAK_REPUTATION);
    }

    // Prior interactions
    if (features.priorInteractionCount > 0) {
      reasons.push(COMPATIBILITY_REASON_CODES.PRIOR_POSITIVE_INTERACTIONS);
    } else {
      reasons.push(COMPATIBILITY_REASON_CODES.NO_PRIOR_INTERACTIONS);
    }

    // Risk factors
    if (features.boundaryViolationRisk >= ELIGIBILITY_THRESHOLDS.maximumBoundaryViolationRisk) {
      reasons.push(COMPATIBILITY_REASON_CODES.HIGH_BOUNDARY_VIOLATION_RISK);
    }

    return reasons;
  }

  private determineEligibility(features: CompatibilityFeatures, score: number): boolean {
    // Check minimum thresholds
    if (features.boundaryMatchScore < ELIGIBILITY_THRESHOLDS.minimumBoundaryMatch) {
      return false;
    }

    if (features.locationMatchScore < ELIGIBILITY_THRESHOLDS.minimumLocationMatch) {
      return false;
    }

    if (features.categoryMatchScore < ELIGIBILITY_THRESHOLDS.minimumCategoryMatch) {
      return false;
    }

    if (
      features.proposerReputationScore < ELIGIBILITY_THRESHOLDS.minimumReputation ||
      features.receiverReputationScore < ELIGIBILITY_THRESHOLDS.minimumReputation
    ) {
      return false;
    }

    if (features.boundaryViolationRisk >= ELIGIBILITY_THRESHOLDS.maximumBoundaryViolationRisk) {
      return false;
    }

    // Minimum overall score for eligibility
    return score >= 0.4;
  }
}

// Eligibility engine interface
export interface EligibilityEngine {
  checkEligibility(context: {
    need: Need;
    offer: Offer;
    needOwner: Profile;
    offerOwner: Profile;
  }): Promise<{
    eligible: boolean;
    score: number;
    reasonCodes: string[];
    disqualificationReasons?: string[];
  }>;
}

// Combined eligibility and compatibility engine
export class CompatibilityEngine implements EligibilityEngine {
  private scorer: DeterministicCompatibilityScorer;

  constructor() {
    this.scorer = new DeterministicCompatibilityScorer();
  }

  async checkEligibility(context: {
    need: Need;
    offer: Offer;
    needOwner: Profile;
    offerOwner: Profile;
  }): Promise<{
    eligible: boolean;
    score: number;
    reasonCodes: string[];
    disqualificationReasons?: string[];
  }> {
    const result = await this.scorer.score(context);
    const disqualificationReasons: string[] = [];

    // Check specific disqualification criteria
    const features = await this.scorer['buildFeatures'](context);

    if (features.boundaryMatchScore < ELIGIBILITY_THRESHOLDS.minimumBoundaryMatch) {
      disqualificationReasons.push('Insufficient boundary compatibility');
    }

    if (
      features.proposerReputationScore < ELIGIBILITY_THRESHOLDS.minimumReputation ||
      features.receiverReputationScore < ELIGIBILITY_THRESHOLDS.minimumReputation
    ) {
      disqualificationReasons.push('Insufficient reputation score');
    }

    if (features.boundaryViolationRisk >= ELIGIBILITY_THRESHOLDS.maximumBoundaryViolationRisk) {
      disqualificationReasons.push('High boundary violation risk');
    }

    return {
      eligible: result.eligible,
      score: result.score,
      reasonCodes: result.reasonCodes,
      disqualificationReasons: disqualificationReasons.length > 0 ? disqualificationReasons : undefined,
    };
  }

  getScorer(): DeterministicCompatibilityScorer {
    return this.scorer;
  }
}