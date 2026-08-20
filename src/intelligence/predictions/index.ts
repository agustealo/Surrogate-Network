// Prediction and outcome contracts for SC-00.5 Intelligence Readiness
// Provides consistent prediction recording and outcome tracking for ML models

// Prediction structure
export interface Prediction {
  id: string;
  predictionType: string; // e.g., 'proposal-success', 'surrogacy-risk', 'compatibility'
  subjectType: 'user' | 'need' | 'offer' | 'proposal' | 'surrogacy';
  subjectId: string;
  featureSnapshotId: string;
  modelId: string; // e.g., 'baseline-scoring', 'xgboost-v1'
  modelVersion: string; // e.g., '1.0.0'
  score: number; // 0-1 prediction score
  confidence: number; // 0-1 model confidence
  reasonCodes?: string[]; // Human-readable explanations
  metadata?: {
    predictionContext?: Record<string, any>;
    modelParameters?: Record<string, any>;
    trainingDataVersion?: string;
    [key: string]: any;
  };
  predictedAt: Date;
}

// Prediction outcome structure
export interface PredictionOutcome {
  id: string;
  predictionId: string;
  actualOutcome: boolean | number; // Actual result (true/false for binary, 0-1 for continuous)
  observedAt: Date;
  outcomeMetadata?: {
    observationMethod?: 'automatic' | 'manual' | 'reported';
    confidenceInOutcome?: number; // 0-1 certainty in outcome measurement
    additionalContext?: Record<string, any>;
    [key: string]: any;
  };
}

// Prediction type definitions
export enum PredictionType {
  PROPOSAL_SUCCESS = 'proposal-success',
  SURROGACY_RISK = 'surrogacy-risk',
  COMPATIBILITY_SCORE = 'compatibility-score',
  USER_CHURN = 'user-churn',
  NEED_FULFILLMENT = 'need-fulfillment',
  OFFER_SUCCESS = 'offer-success',
  ENGAGEMENT_PREDICTION = 'engagement-prediction',
  TRUST_SCORE = 'trust-score',
}

// Model identifiers
export enum ModelId {
  // Deterministic baseline models
  BASELINE_COMPATIBILITY = 'baseline-compatibility',
  BASELINE_PROPOSAL_SUCCESS = 'baseline-proposal-success',
  BASELINE_SURROGACY_RISK = 'baseline-surrogacy-risk',
  
  // Placeholder for future ML models (not implementing yet)
  // XGBOOST_PROPOSAL_SUCCESS = 'xgboost-proposal-success-v1',
  // LIGHTGBM_COMPATIBILITY = 'lightgbm-compatibility-v1',
}

// Prediction repository interface
export interface PredictionRepository {
  record(prediction: Omit<Prediction, 'id' | 'predictedAt'>): Promise<string>;
  recordBatch(predictions: Omit<Prediction, 'id' | 'predictedAt'>[]): Promise<string[]>;
  getById(id: string): Promise<Prediction | null>;
  getBySubject(subjectType: string, subjectId: string, limit?: number): Promise<Prediction[]>;
  getByPredictionType(predictionType: string, limit?: number): Promise<Prediction[]>;
  getByModel(modelId: string, limit?: number): Promise<Prediction[]>;
  getUnobservedPredictions(limit?: number): Promise<Prediction[]>;
}

// Outcome repository interface
export interface OutcomeRepository {
  record(outcome: Omit<PredictionOutcome, 'id'>): Promise<string>;
  recordBatch(outcomes: Omit<PredictionOutcome, 'id'>[]): Promise<string[]>;
  getById(id: string): Promise<PredictionOutcome | null>;
  getByPredictionId(predictionId: string): Promise<PredictionOutcome | null>;
  getRecentOutcomes(limit?: number): Promise<PredictionOutcome[]>;
  getModelPerformance(modelId: string, timeRange?: { start: Date; end: Date }): Promise<ModelPerformance>;
}

// Model performance metrics
export interface ModelPerformance {
  modelId: string;
  modelVersion: string;
  predictionType: string;
  totalPredictions: number;
  totalOutcomes: number;
  accuracy?: number; // For binary classification
  precision?: number;
  recall?: number;
  f1Score?: number;
  mse?: number; // For regression
  mae?: number; // For regression
  calibration?: number; // How well confidence matches actual performance
  timeRange: { start: Date; end: Date };
  calculatedAt: Date;
}

// Prediction context for compatibility scoring
export interface CompatibilityPredictionContext {
  needId: string;
  offerId: string;
  needOwnerId: string;
  offerOwnerId: string;
  scoringFactors: {
    boundaryCompatibility: number;
    locationCompatibility: number;
    categoryAlignment: number;
    availabilityOverlap: number;
    capacityAlignment: number;
    reputationAlignment: number;
  };
}

// Prediction result for API responses
export interface PredictionResult {
  predictionId: string;
  score: number;
  confidence: number;
  eligible: boolean; // Binary decision based on score
  reasonCodes: string[];
  featureSnapshotId: string;
  modelUsed: {
    id: string;
    version: string;
    type: string;
  };
  createdAt: Date;
}

// Scorer interface (for deterministic baseline scoring)
export interface PredictionScorer {
  score(context: Record<string, any>): Promise<PredictionResult>;
  getModelInfo(): { id: string; version: string; type: string };
}

// Prediction factory
export class PredictionFactory {
  static createCompatibilityPrediction(
    subjectId: string,
    featureSnapshotId: string,
    score: number,
    confidence: number,
    reasonCodes: string[],
    context?: CompatibilityPredictionContext
  ): Omit<Prediction, 'id' | 'predictedAt'> {
    return {
      predictionType: PredictionType.COMPATIBILITY_SCORE,
      subjectType: 'need', // or 'offer' depending on context
      subjectId,
      featureSnapshotId,
      modelId: ModelId.BASELINE_COMPATIBILITY,
      modelVersion: '1.0.0',
      score,
      confidence,
      reasonCodes,
      metadata: {
        predictionContext: context,
      },
    };
  }

  static createProposalSuccessPrediction(
    subjectId: string,
    featureSnapshotId: string,
    score: number,
    confidence: number,
    reasonCodes: string[],
    context?: Record<string, any>
  ): Omit<Prediction, 'id' | 'predictedAt'> {
    return {
      predictionType: PredictionType.PROPOSAL_SUCCESS,
      subjectType: 'proposal',
      subjectId,
      featureSnapshotId,
      modelId: ModelId.BASELINE_PROPOSAL_SUCCESS,
      modelVersion: '1.0.0',
      score,
      confidence,
      reasonCodes,
      metadata: {
        predictionContext: context,
      },
    };
  }

  static createSurrogacyRiskPrediction(
    subjectId: string,
    featureSnapshotId: string,
    score: number,
    confidence: number,
    reasonCodes: string[],
    context?: Record<string, any>
  ): Omit<Prediction, 'id' | 'predictedAt'> {
    return {
      predictionType: PredictionType.SURROGACY_RISK,
      subjectType: 'surrogacy',
      subjectId,
      featureSnapshotId,
      modelId: ModelId.BASELINE_SURROGACY_RISK,
      modelVersion: '1.0.0',
      score,
      confidence,
      reasonCodes,
      metadata: {
        predictionContext: context,
      },
    };
  }

  static createOutcome(
    predictionId: string,
    actualOutcome: boolean | number,
    metadata?: PredictionOutcome['outcomeMetadata']
  ): Omit<PredictionOutcome, 'id'> {
    return {
      predictionId,
      actualOutcome,
      observedAt: new Date(),
      outcomeMetadata: metadata,
    };
  }
}

// Performance calculator for model evaluation
export class ModelPerformanceCalculator {
  static calculateBinaryClassification(
    predictions: Array<{ score: number; actualOutcome: boolean }>,
    threshold: number = 0.5
  ): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
  } {
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    predictions.forEach(({ score, actualOutcome }) => {
      const predicted = score >= threshold;
      if (predicted && actualOutcome) truePositives++;
      else if (predicted && !actualOutcome) falsePositives++;
      else if (!predicted && actualOutcome) falseNegatives++;
      else trueNegatives++;
    });

    const accuracy = (truePositives + trueNegatives) / predictions.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * ((precision * recall) / (precision + recall)) || 0;

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      truePositives,
      falsePositives,
      trueNegatives,
      falseNegatives,
    };
  }

  static calculateRegression(
    predictions: Array<{ score: number; actualOutcome: number }>
  ): {
    mse: number;
    mae: number;
    rmse: number;
  } {
    const n = predictions.length;
    const errors = predictions.map(({ score, actualOutcome }) => score - actualOutcome);
    
    const mse = errors.reduce((sum, error) => sum + error * error, 0) / n;
    const mae = errors.reduce((sum, error) => sum + Math.abs(error), 0) / n;
    const rmse = Math.sqrt(mse);

    return { mse, mae, rmse };
  }

  static calculateCalibration(
    predictions: Array<{ score: number; confidence: number; actualOutcome: boolean }>,
    bins: number = 10
  ): {
    calibrationError: number;
    binData: Array<{
      predictedRange: [number, number];
      predictedRate: number;
      actualRate: number;
      count: number;
    }>;
  } {
    const binSize = 1 / bins;
    const binData: Array<{
      predictedRange: [number, number];
      predictedRate: number;
      actualRate: number;
      count: number;
    }> = [];

    for (let i = 0; i < bins; i++) {
      const lowerBound = i * binSize;
      const upperBound = (i + 1) * binSize;
      const binPredictions = predictions.filter(
        ({ score }) => score >= lowerBound && score < upperBound
      );

      if (binPredictions.length > 0) {
        const predictedRate = (lowerBound + upperBound) / 2;
        const actualRate =
          binPredictions.filter(({ actualOutcome }) => actualOutcome).length /
          binPredictions.length;

        binData.push({
          predictedRange: [lowerBound, upperBound],
          predictedRate,
          actualRate,
          count: binPredictions.length,
        });
      }
    }

    // Calculate mean calibration error
    const calibrationError =
      binData.reduce((sum, bin) => sum + Math.abs(bin.predictedRate - bin.actualRate), 0) /
      binData.length;

    return { calibrationError, binData };
  }
}