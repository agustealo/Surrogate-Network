// Command Architecture Foundation for SC-00.4
// Provides the base infrastructure for atomic, idempotent business operations

import type { VerificationStatus } from '@/domain/types';

/**
 * Command result type - represents the outcome of any command execution
 */
export interface CommandResult<T = any> {
  success: boolean;
  data?: T;
  error?: DomainError;
  eventId?: string; // Reference to outbox event
  auditId?: string; // Reference to audit entry
}

/**
 * Domain error with structured error information
 */
export interface DomainError {
  code: ReasonCode;
  message: string;
  details?: Record<string, any>;
  recoverable: boolean;
}

/**
 * Standardized error codes across the domain
 */
export type ReasonCode = 
  // Authorization errors
  | 'UNAUTHORIZED' 
  | 'FORBIDDEN'
  | 'INSUFFICIENT_PERMISSIONS'
  
  // Validation errors
  | 'INVALID_INPUT'
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_STATE_TRANSITION'
  | 'BUSINESS_RULE_VIOLATION'
  
  // Business logic errors
  | 'PROPOSAL_NOT_FOUND'
  | 'PROPOSAL_ALREADY_ACCEPTED'
  | 'PROPOSAL_ALREADY_DECLINED'
  | 'OFFER_CAPACITY_FULL'
  | 'INSUFFICIENT_TOKENS'
  | 'RATE_LIMIT_EXCEEDED'
  
  // System errors
  | 'DATABASE_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'TIMEOUT'
  
  // Idempotency errors
  | 'DUPLICATE_COMMAND'
  | 'IDEMPOTENCY_KEY_EXPIRED';

/**
 * Command context - provides all necessary context for command execution
 */
export interface CommandContext {
  actorId: string;
  actorName: string;
  actorRoles: string[];
  timestamp: string;
  idempotencyKey?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Base interface for all commands
 */
export interface Command {
  commandType: string;
  aggregateId?: string;
  context: CommandContext;
  timestamp: string;
}

/**
 * Command handler interface
 */
export interface CommandHandler<T extends Command, R = any> {
  execute(command: T): Promise<CommandResult<R>>;
  validate(command: T): Promise<DomainError | null>;
  getRequiredCapabilities(): string[];
}

/**
 * Authenticated actor information
 */
export interface AuthenticatedActor {
  id: string;
  name: string;
  email?: string;
  roles: string[];
  capabilities: string[];
  isAuthenticated: boolean;
}

/**
 * Clock interface for deterministic time handling
 */
export interface Clock {
  now(): Date;
  inFuture(duration: Duration): Date;
  inPast(duration: Duration): Date;
}

export interface Duration {
  amount: number;
  unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days';
}

/**
 * Idempotency key interface
 */
export interface IdempotencyKey {
  value: string;
  actorId: string;
  commandType: string;
  aggregateId?: string;
  expiresAt?: Date;
}

/**
 * Audit recorder interface
 */
export interface AuditRecorder {
  record(event: AuditEvent): Promise<string>;
}

/**
 * Audit event structure
 */
export interface AuditEvent {
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
  eventId?: string; // Links to outbox event
}

/**
 * Event outbox entry
 */
export interface OutboxEvent {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: any;
  occurredAt: Date;
  processedAt?: Date;
  attemptCount?: number;
  lastError?: string;
}

/**
 * Capability checking service
 */
export interface CapabilityService {
  can(actorId: string, capability: string): Promise<boolean>;
  hasAnyCapability(actorId: string, capabilities: string[]): Promise<boolean>;
  hasAllCapabilities(actorId: string, capabilities: string[]): Promise<boolean>;
}

/**
 * Transaction manager interface
 */
export interface TransactionManager {
  beginTransaction(): Promise<Transaction>;
}

/**
 * Transaction interface
 */
export interface Transaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  execute<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
}

/**
 * Domain event base interface
 */
export interface DomainEvent {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: any;
  occurredAt: Date;
  causationId?: string; // ID of command that caused this event
  correlationId?: string; // Groups related events
}

// Default implementations

/**
 * Default clock implementation using system time
 */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  inFuture(duration: Duration): Date {
    const now = this.now();
    const milliseconds = this.durationToMs(duration);
    return new Date(now.getTime() + milliseconds);
  }

  inPast(duration: Duration): Date {
    const now = this.now();
    const milliseconds = this.durationToMs(duration);
    return new Date(now.getTime() - milliseconds);
  }

  private durationToMs(duration: Duration): number {
    const multipliers = {
      milliseconds: 1,
      seconds: 1000,
      minutes: 60000,
      hours: 3600000,
      days: 86400000,
    };
    return duration.amount * multipliers[duration.unit];
  }
}

/**
 * Create a domain error
 */
export function createDomainError(
  code: ReasonCode,
  message: string,
  recoverable: boolean = false,
  details?: Record<string, any>
): DomainError {
  return { code, message, recoverable, details };
}

/**
 * Create a successful command result
 */
export function createSuccessResult<T>(data: T, eventId?: string, auditId?: string): CommandResult<T> {
  return {
    success: true,
    data,
    eventId,
    auditId,
  };
}

/**
 * Create a failed command result
 */
export function createErrorResult(error: DomainError): CommandResult {
  return {
    success: false,
    error,
  };
}

/**
 * Generate an idempotency key
 */
export function generateIdempotencyKey(
  actorId: string,
  commandType: string,
  aggregateId?: string
): string {
  const components = [actorId, commandType];
  if (aggregateId) {
    components.push(aggregateId);
  }
  return components.join(':');
}

/**
 * Check if an idempotency key has expired
 */
export function isIdempotencyKeyExpired(expiresAt?: Date): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}