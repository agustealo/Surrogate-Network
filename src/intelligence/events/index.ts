// Intelligence event contracts for SC-00.5 Runtime Truth & Intelligence Readiness
// Recording behavioral facts that become training data for future ML models

// Event types representing canonical business events
export enum IntelligenceEventType {
  // Need lifecycle events
  NEED_CREATED = 'NeedCreated',
  NEED_VIEWED = 'NeedViewed',
  NEED_UPDATED = 'NeedUpdated',
  NEED_DELETED = 'NeedDeleted',
  NEED_FILLED = 'NeedFilled',
  NEED_EXPIRED = 'NeedExpired',
  
  // Offer lifecycle events
  OFFER_CREATED = 'OfferCreated',
  OFFER_VIEWED = 'OfferViewed',
  OFFER_UPDATED = 'OfferUpdated',
  OFFER_DELETED = 'OfferDeleted',
  OFFER_FULL = 'OfferFull',
  OFFER_PAUSED = 'OfferPaused',
  
  // Proposal lifecycle events
  PROPOSAL_CREATED = 'ProposalCreated',
  PROPOSAL_ACCEPTED = 'ProposalAccepted',
  PROPOSAL_DECLINED = 'ProposalDeclined',
  PROPOSAL_WITHDRAWN = 'ProposalWithdrawn',
  PROPOSAL_COUNTERED = 'ProposalCountered',
  PROPOSAL_EXPIRED = 'ProposalExpired',
  
  // Relationship lifecycle events
  SURROGACY_STARTED = 'SurrogacyStarted',
  SURROGACY_PAUSED = 'SurrogacyPaused',
  SURROGACY_RESUMED = 'SurrogacyResumed',
  SURROGACY_ENDED = 'SurrogacyEnded',
  SURROGACY_COMPLETED = 'SurrogacyCompleted',
  
  // Moment lifecycle events
  MOMENT_SCHEDULED = 'MomentScheduled',
  MOMENT_STARTED = 'MomentStarted',
  MOMENT_COMPLETED = 'MomentCompleted',
  MOMENT_CANCELLED = 'MomentCancelled',
  MOMENT_MISSED = 'MomentMissed',
  
  // Exchange lifecycle events
  EXCHANGE_COMPLETED = 'ExchangeCompleted',
  EXCHANGE_PARTIAL = 'ExchangePartial',
  EXCHANGE_DISPUTED = 'ExchangeDisputed',
  
  // Feedback lifecycle events
  FEEDBACK_SUBMITTED = 'FeedbackSubmitted',
  FEEDBACK_UPDATED = 'FeedbackUpdated',
  
  // Safety and trust events
  USER_BLOCKED = 'UserBlocked',
  USER_UNBLOCKED = 'UserUnblocked',
  REPORT_CREATED = 'ReportCreated',
  REPORT_RESOLVED = 'ReportResolved',
  
  // Economy events
  TOKENS_GRANTED = 'TokensGranted',
  TOKENS_CONSUMED = 'TokensConsumed',
  TOKENS_ADJUSTED = 'TokensAdjusted',
  XP_GRANTED = 'XPGranted',
  XP_ADJUSTED = 'XPAdjusted',
  
  // Engagement events
  PROFILE_VIEWED = 'ProfileViewed',
  SEARCH_PERFORMED = 'SearchPerformed',
  FILTER_APPLIED = 'FilterApplied',
}

// Base intelligence event structure
export interface IntelligenceEvent {
  id: string;
  eventType: IntelligenceEventType;
  aggregateType: string; // 'need', 'offer', 'proposal', 'surrogacy', etc.
  aggregateId: string;
  actorId?: string; // Nullable for system events
  payload: Record<string, any>;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    [key: string]: any;
  };
  occurredAt: Date;
  recordedAt?: Date;
}

// Need-specific event payloads
export interface NeedCreatedPayload {
  needId: string;
  userId: string;
  category: string;
  locationMode: string;
  boundaries: string[];
  tags?: string[];
  urgency?: string;
}

export interface NeedViewedPayload {
  needId: string;
  viewerId: string;
  ownerId: string;
  viewDuration?: number; // milliseconds
  source?: 'search' | 'profile' | 'direct' | 'recommendation';
}

// Offer-specific event payloads
export interface OfferCreatedPayload {
  offerId: string;
  userId: string;
  category: string;
  capacity?: number;
  boundaries: string[];
}

export interface OfferViewedPayload {
  offerId: string;
  viewerId: string;
  ownerId: string;
  viewDuration?: number;
  source?: 'search' | 'profile' | 'direct' | 'recommendation';
}

// Proposal-specific event payloads
export interface ProposalCreatedPayload {
  proposalId: string;
  needId: string;
  offerId: string;
  proposingUserId: string;
  receivingUserId: string;
  proposedDuration?: string;
  message?: string;
}

export interface ProposalAcceptedPayload {
  proposalId: string;
  needId: string;
  offerId: string;
  surrogacyId: string;
  acceptingUserId: string;
  timeToAccept?: number; // milliseconds from creation
}

// Relationship-specific event payloads
export interface SurrogacyStartedPayload {
  surrogacyId: string;
  needId: string;
  offerId: string;
  participantIds: string[];
  boundaries: string[];
  expectations?: string[];
  communicationMethod: string;
}

export interface SurrogacyCompletedPayload {
  surrogacyId: string;
  needId: string;
  offerId: string;
  duration: number; // milliseconds
  totalMoments: number;
  totalExchanges: number;
  completionReason?: string;
}

// Feedback-specific event payloads
export interface FeedbackSubmittedPayload {
  feedbackId: string;
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
  skillEndorsements?: string[];
}

// Engagement event payloads
export interface ProfileViewedPayload {
  profileId: string;
  viewerId: string;
  ownerId: string;
  viewDuration?: number;
  source?: 'search' | 'proposal' | 'surrogacy' | 'direct';
  sectionsViewed?: string[];
}

export interface SearchPerformedPayload {
  searcherId: string;
  searchType: 'need' | 'offer' | 'profile';
  query?: string;
  filters: Record<string, any>;
  resultCount: number;
  clickedResultId?: string;
}

// Event recorder interface
export interface IntelligenceEventRecorder {
  record(event: Omit<IntelligenceEvent, 'id' | 'recordedAt'>): Promise<string>;
  recordBatch(events: Omit<IntelligenceEvent, 'id' | 'recordedAt'>[]): Promise<string[]>;
  getEventsByAggregate(aggregateType: string, aggregateId: string): Promise<IntelligenceEvent[]>;
  getEventsByActor(actorId: string, limit?: number): Promise<IntelligenceEvent[]>;
  getEventsByType(eventType: IntelligenceEventType, limit?: number): Promise<IntelligenceEvent[]>;
  getEventsByTimeRange(start: Date, end: Date): Promise<IntelligenceEvent[]>;
}

// Event context builder
export interface EventContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  timestamp?: Date;
}

export function buildEventContext(
  actorId?: string,
  additionalContext?: Partial<EventContext>
): Partial<EventContext> {
  return {
    actorId,
    ...additionalContext,
    timestamp: additionalContext?.timestamp || new Date(),
  };
}

// Event factory for creating typed events
export class IntelligenceEventFactory {
  static createNeedCreated(
    payload: NeedCreatedPayload,
    context?: Partial<EventContext>
  ): Omit<IntelligenceEvent, 'id' | 'recordedAt'> {
    return {
      eventType: IntelligenceEventType.NEED_CREATED,
      aggregateType: 'need',
      aggregateId: payload.needId,
      actorId: payload.userId,
      payload,
      metadata: context,
      occurredAt: context?.timestamp || new Date(),
    };
  }

  static createOfferCreated(
    payload: OfferCreatedPayload,
    context?: Partial<EventContext>
  ): Omit<IntelligenceEvent, 'id' | 'recordedAt'> {
    return {
      eventType: IntelligenceEventType.OFFER_CREATED,
      aggregateType: 'offer',
      aggregateId: payload.offerId,
      actorId: payload.userId,
      payload,
      metadata: context,
      occurredAt: context?.timestamp || new Date(),
    };
  }

  static createProposalCreated(
    payload: ProposalCreatedPayload,
    context?: Partial<EventContext>
  ): Omit<IntelligenceEvent, 'id' | 'recordedAt'> {
    return {
      eventType: IntelligenceEventType.PROPOSAL_CREATED,
      aggregateType: 'proposal',
      aggregateId: payload.proposalId,
      actorId: payload.proposingUserId,
      payload,
      metadata: context,
      occurredAt: context?.timestamp || new Date(),
    };
  }

  static createProposalAccepted(
    payload: ProposalAcceptedPayload,
    context?: Partial<EventContext>
  ): Omit<IntelligenceEvent, 'id' | 'recordedAt'> {
    return {
      eventType: IntelligenceEventType.PROPOSAL_ACCEPTED,
      aggregateType: 'proposal',
      aggregateId: payload.proposalId,
      actorId: payload.acceptingUserId,
      payload,
      metadata: context,
      occurredAt: context?.timestamp || new Date(),
    };
  }

  static createSurrogacyStarted(
    payload: SurrogacyStartedPayload,
    context?: Partial<EventContext>
  ): Omit<IntelligenceEvent, 'id' | 'recordedAt'> {
    return {
      eventType: IntelligenceEventType.SURROGACY_STARTED,
      aggregateType: 'surrogacy',
      aggregateId: payload.surrogacyId,
      payload,
      metadata: context,
      occurredAt: context?.timestamp || new Date(),
    };
  }

  static createSurrogacyCompleted(
    payload: SurrogacyCompletedPayload,
    context?: Partial<EventContext>
  ): Omit<IntelligenceEvent, 'id' | 'recordedAt'> {
    return {
      eventType: IntelligenceEventType.SURROGACY_COMPLETED,
      aggregateType: 'surrogacy',
      aggregateId: payload.surrogacyId,
      payload,
      metadata: context,
      occurredAt: context?.timestamp || new Date(),
    };
  }

  static createFeedbackSubmitted(
    payload: FeedbackSubmittedPayload,
    context?: Partial<EventContext>
  ): Omit<IntelligenceEvent, 'id' | 'recordedAt'> {
    return {
      eventType: IntelligenceEventType.FEEDBACK_SUBMITTED,
      aggregateType: 'feedback',
      aggregateId: payload.feedbackId,
      actorId: payload.fromUserId,
      payload,
      metadata: context,
      occurredAt: context?.timestamp || new Date(),
    };
  }

  static createProfileViewed(
    payload: ProfileViewedPayload,
    context?: Partial<EventContext>
  ): Omit<IntelligenceEvent, 'id' | 'recordedAt'> {
    return {
      eventType: IntelligenceEventType.PROFILE_VIEWED,
      aggregateType: 'profile',
      aggregateId: payload.profileId,
      actorId: payload.viewerId,
      payload,
      metadata: context,
      occurredAt: context?.timestamp || new Date(),
    };
  }

  static createSearchPerformed(
    payload: SearchPerformedPayload,
    context?: Partial<EventContext>
  ): Omit<IntelligenceEvent, 'id' | 'recordedAt'> {
    return {
      eventType: IntelligenceEventType.SEARCH_PERFORMED,
      aggregateType: 'search',
      aggregateId: crypto.randomUUID(),
      actorId: payload.searcherId,
      payload,
      metadata: context,
      occurredAt: context?.timestamp || new Date(),
    };
  }
}