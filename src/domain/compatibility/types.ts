// Compatibility types and system
// Centralized compatibility logic for the application

export type CompatibilityDimension = {
  name: string;
  score: number;
  weight: number;
  factors: string[];
  warnings?: string[];
};

export type CompatibilityResult = {
  overall: number;
  dimensions: CompatibilityDimension[];
  reasons: string[];
  warnings: string[];
  confidence: number;
};

export type NeedOfferCompatibilityParams = {
  needId: string;
  offerId: string;
  needBoundaries: string[];
  offerBoundaries: string[];
  needLocationMode: 'remote' | 'local' | 'either';
  offerLocationMode: 'remote' | 'local' | 'either';
  needTiming?: string;
  offerTiming?: string;
  needCategory: string;
  offerCategory: string;
  needTags: string[];
  offerTags: string[];
};

// Predefined compatibility dimensions
export const COMPATIBILITY_DIMENSIONS: Record<string, Omit<CompatibilityDimension, 'score' | 'factors' | 'warnings'>> = {
  boundaryFit: {
    name: 'Boundary Fit',
    weight: 0.25,
  },
  locationFit: {
    name: 'Location Match',
    weight: 0.20,
  },
  categoryAlignment: {
    name: 'Category Alignment',
    weight: 0.15,
  },
  tagOverlap: {
    name: 'Interest Overlap',
    weight: 0.15,
  },
  timingMatch: {
    name: 'Availability Match',
    weight: 0.15,
  },
  experienceMatch: {
    name: 'Experience Level',
    weight: 0.10,
  },
};

export type CompatibilityLevel = 'excellent' | 'good' | 'moderate' | 'low' | 'poor';

export const getCompatibilityLevel = (score: number): CompatibilityLevel => {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 50) return 'moderate';
  if (score >= 25) return 'low';
  return 'poor';
};

export const getCompatibilityColor = (score: number): string => {
  const level = getCompatibilityLevel(score);
  const colors = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    moderate: 'bg-yellow-500',
    low: 'bg-orange-500',
    poor: 'bg-red-500',
  };
  return colors[level];
};

export const getCompatibilityTextColor = (score: number): string => {
  const level = getCompatibilityLevel(score);
  const colors = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    moderate: 'text-yellow-600',
    low: 'text-orange-600',
    poor: 'text-red-600',
  };
  return colors[level];
};