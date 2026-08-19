// Proposal Command Implementations with State Machine and Idempotency
// These are the atomic commands for proposal workflow operations

import {
  Command,
  CommandContext,
  CommandResult,
  DomainError,
  createDomainError,
  createSuccessResult,
  createErrorResult,
  ReasonCode,
  generateIdempotencyKey,
  AuditEvent,
  DomainEvent,
} from './Command';
import { AtomicTransaction, TransactionBuilder } from './AtomicTransaction';
import type { Proposal, Surrogacy, Offer, Need } from '@/domain/types';

/**
 * Proposal state transition validation
 */
export class ProposalStateMachine {
  private static readonly VALID_TRANSITIONS: Record<string, string[]> = {
    'pending': ['accepted', 'declined', 'countered', 'withdrawn'],
    'countered': ['accepted', 'declined', 'countered', 'withdrawn'],
    'accepted': [], // Final state
    'declined': [], // Final state
    'withdrawn': [], // Final state
  };

  static canTransition(from: string, to: string): boolean {
    return this.VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  static validateTransition(
    currentStatus: string,
    newStatus: string,
    actorId: string,
    proposingUserId: string,
    receivingUserId: string
  ): DomainError | null {
    if (!this.canTransition(currentStatus, newStatus)) {
      return createDomainError(
        'INVALID_STATE_TRANSITION',
        `Cannot transition proposal from ${currentStatus} to ${newStatus}`,
        false,
        { currentStatus, newStatus }
      );
    }

    // Validate actor authority for specific transitions
    switch (newStatus) {
      case 'withdrawn':
        if (actorId !== proposingUserId) {
          return createDomainError(
            'FORBIDDEN',
            'Only the proposing user can withdraw a proposal',
            false,
            { actorId, proposingUserId }
          );
        }
        break;

      case 'accepted':
      case 'declined':
      case 'countered':
        if (actorId !== receivingUserId) {
          return createDomainError(
            'FORBIDDEN',
            `Only the receiving user can ${newStatus} a proposal`,
            false,
            { actorId, receivingUserId }
          );
        }
        break;
    }

    return null;
  }
}

/**
 * Create Proposal Command
 */
export interface CreateProposalCommand extends Command {
  commandType: 'create_proposal';
  aggregateId?: string;
  context: CommandContext;
  proposal: {
    needId: string;
    offerId: string;
    message?: string;
    proposedDate?: string;
    duration?: string;
    frequency?: string;
    locationMethod?: string;
  };
}

export class CreateProposalHandler {
  async execute(command: CreateProposalCommand): Promise<CommandResult<Proposal>> {
    // Check idempotency
    const idempotencyKey = generateIdempotencyKey(
      command.context.actorId,
      command.commandType,
      `${command.proposal.needId}:${command.proposal.offerId}`
    );

    // Validate proposal doesn't already exist between these parties for this need/offer
    // Implementation depends on your repository pattern

    // Execute atomic transaction:
    // 1. Create proposal
    // 2. Record audit event
    // 3. Emit proposal_created event

    return createSuccessResult({} as Proposal, 'event-id', 'audit-id');
  }

  async validate(command: CreateProposalCommand): Promise<DomainError | null> {
    // Validate that user cannot propose to themselves
    // Validate that need and offer exist
    // Validate that need is still active
    // Validate that offer has capacity
    return null;
  }

  getRequiredCapabilities(): string[] {
    return ['create_proposals'];
  }
}

/**
 * Withdraw Proposal Command
 */
export interface WithdrawProposalCommand extends Command {
  commandType: 'withdraw_proposal';
  aggregateId: string; // proposal ID
  context: CommandContext;
  reason?: string;
}

export class WithdrawProposalHandler {
  async execute(command: WithdrawProposalCommand): Promise<CommandResult<Proposal>> {
    // Validate current state and authority
    const proposal = await this.getProposal(command.aggregateId);
    
    const stateError = ProposalStateMachine.validateTransition(
      proposal.status,
      'withdrawn',
      command.context.actorId,
      proposal.proposingUserId,
      proposal.receivingUserId
    );

    if (stateError) {
      return createErrorResult(stateError);
    }

    // Execute atomic transaction:
    // 1. Update proposal status to 'withdrawn'
    // 2. Record audit event
    // 3. Emit proposal_withdrawn event

    return createSuccessResult(proposal, 'event-id', 'audit-id');
  }

  async validate(command: WithdrawProposalCommand): Promise<DomainError | null> {
    const proposal = await this.getProposal(command.aggregateId);
    
    if (!proposal) {
      return createDomainError(
        'PROPOSAL_NOT_FOUND',
        `Proposal ${command.aggregateId} not found`,
        false
      );
    }

    return ProposalStateMachine.validateTransition(
      proposal.status,
      'withdrawn',
      command.context.actorId,
      proposal.proposingUserId,
      proposal.receivingUserId
    );
  }

  getRequiredCapabilities(): string[] {
    return ['withdraw_own_proposals'];
  }

  private async getProposal(id: string): Promise<Proposal> {
    // Implementation depends on your repository pattern
    return {} as Proposal;
  }
}

/**
 * Accept Proposal Command - Atomic Operation
 */
export interface AcceptProposalCommand extends Command {
  commandType: 'accept_proposal';
  aggregateId: string; // proposal ID
  context: CommandContext;
  proposedDate?: string;
  duration?: string;
  frequency?: string;
  locationMethod?: string;
}

export class AcceptProposalHandler {
  async execute(command: AcceptProposalCommand): Promise<CommandResult<{ proposal: Proposal; surrogacy: Surrogacy }>> {
    // Get current proposal state
    const proposal = await this.getProposal(command.aggregateId);
    
    // Validate state transition
    const stateError = ProposalStateMachine.validateTransition(
      proposal.status,
      'accepted',
      command.context.actorId,
      proposal.proposingUserId,
      proposal.receivingUserId
    );

    if (stateError) {
      return createErrorResult(stateError);
    }

    // Create and execute atomic transaction
    const transaction = new TransactionBuilder()
      .step(
        'validate_proposal_state',
        async () => {
          // Validate proposal is still in pending state
          const currentProposal = await this.getProposal(command.aggregateId);
          if ((currentProposal as any).status !== 'pending') {
            throw createDomainError(
              'INVALID_STATE_TRANSITION',
              'Proposal is no longer in pending state',
              false,
              { currentStatus: (currentProposal as any).status }
            );
          }
          return currentProposal;
        }
      )
      .step(
        'check_offer_capacity',
        async (proposal) => {
          // Validate offer has capacity
          const offer = await this.getOffer((proposal as any).offerId);
          const currentCapacity = (offer as any).currentCapacity || 0;
          const capacity = (offer as any).capacity;
          if (capacity && currentCapacity >= capacity) {
            throw createDomainError(
              'OFFER_CAPACITY_FULL',
              'The offer has reached full capacity',
              false
            );
          }
          return offer;
        }
      )
      .step(
        'update_proposal_status',
        async (offer: any) => {
          // Update proposal status to accepted
          const updatedProposal = await this.updateProposalStatus(command.aggregateId, 'accepted');
          return { proposal: updatedProposal, offer };
        }
      )
      .step(
        'reserve_offer_capacity',
        async ({ proposal, offer }: any) => {
          // Increment offer current capacity
          const updatedOffer = await this.incrementOfferCapacity((proposal as any).offerId);
          return { proposal, offer: updatedOffer };
        }
      )
      .step(
        'create_surrogacy',
        async ({ proposal, offer }: any) => {
          // Create surrogacy relationship
          const surrogacy = await this.createSurrogacy(proposal, offer);
          return { proposal, surrogacy, offer };
        }
      )
      .step(
        'add_participants',
        async ({ proposal, surrogacy }: any) => {
          // Add both participants to surrogacy
          await this.addSurrogacyParticipant(surrogacy.id, (proposal as any).proposingUserId, 'proposer');
          await this.addSurrogacyParticipant(surrogacy.id, (proposal as any).receivingUserId, 'recipient');
          return { proposal, surrogacy };
        }
      )
      .step(
        'record_audit',
        async ({ proposal, surrogacy }: any) => {
          // Record audit event
          const auditId = await this.recordAuditEvent({
            actorId: command.context.actorId,
            action: 'accept_proposal',
            targetId: (proposal as any).id,
            targetType: 'proposal',
            before: { status: 'pending' },
            after: { status: 'accepted', surrogacyId: surrogacy.id },
            reason: command.context.ipAddress,
            timestamp: command.context.timestamp,
          });
          return { proposal, surrogacy, auditId };
        }
      )
      .step(
        'emit_event',
        async ({ proposal, surrogacy, auditId }: any) => {
          // Emit proposal accepted event to outbox
          const eventId = await this.emitOutboxEvent({
            eventType: 'proposal_accepted',
            aggregateType: 'proposal',
            aggregateId: (proposal as any).id,
            payload: {
              proposalId: (proposal as any).id,
              surrogacyId: surrogacy.id,
              acceptedBy: command.context.actorId,
              auditId,
            },
            occurredAt: new Date(),
          });
          return { proposal, surrogacy, eventId };
        }
      )
      .build(
        'accept_proposal_transaction',
        () => this.beginTransaction()
      );

    const result = await transaction.execute(command.aggregateId);

    if (!result.success) {
      return result;
    }

    return createSuccessResult(result.data!, result.data?.eventId, result.data?.auditId);
  }

  async validate(command: AcceptProposalCommand): Promise<DomainError | null> {
    const proposal = await this.getProposal(command.aggregateId);
    
    if (!proposal) {
      return createDomainError(
        'PROPOSAL_NOT_FOUND',
        `Proposal ${command.aggregateId} not found`,
        false
      );
    }

    return ProposalStateMachine.validateTransition(
      proposal.status,
      'accepted',
      command.context.actorId,
      proposal.proposingUserId,
      proposal.receivingUserId
    );
  }

  getRequiredCapabilities(): string[] {
    return ['accept_proposals'];
  }

  // Helper methods (implementation depends on your repository pattern)
  private async getProposal(id: string): Promise<Proposal> { return {} as Proposal; }
  private async getOffer(id: string): Promise<Offer> { return {} as Offer; }
  private async updateProposalStatus(id: string, status: string): Promise<Proposal> { return {} as Proposal; }
  private async incrementOfferCapacity(id: string): Promise<Offer> { return {} as Offer; }
  private async createSurrogacy(proposal: Proposal, offer: Offer): Promise<Surrogacy> { return {} as Surrogacy; }
  private async addSurrogacyParticipant(surrogacyId: string, userId: string, role: string): Promise<void> {}
  private async recordAuditEvent(event: AuditEvent): Promise<string> { return ''; }
  private async emitOutboxEvent(event: DomainEvent): Promise<string> { return ''; }
  private async beginTransaction(): Promise<any> { return {}; }
}

/**
 * Decline Proposal Command
 */
export interface DeclineProposalCommand extends Command {
  commandType: 'decline_proposal';
  aggregateId: string; // proposal ID
  context: CommandContext;
  reason?: string;
}

export class DeclineProposalHandler {
  async execute(command: DeclineProposalCommand): Promise<CommandResult<Proposal>> {
    const proposal = await this.getProposal(command.aggregateId);
    
    const stateError = ProposalStateMachine.validateTransition(
      proposal.status,
      'declined',
      command.context.actorId,
      proposal.proposingUserId,
      proposal.receivingUserId
    );

    if (stateError) {
      return createErrorResult(stateError);
    }

    // Execute atomic transaction:
    // 1. Update proposal status to 'declined'
    // 2. Record audit event
    // 3. Emit proposal_declined event

    return createSuccessResult(proposal, 'event-id', 'audit-id');
  }

  async validate(command: DeclineProposalCommand): Promise<DomainError | null> {
    const proposal = await this.getProposal(command.aggregateId);
    
    if (!proposal) {
      return createDomainError(
        'PROPOSAL_NOT_FOUND',
        `Proposal ${command.aggregateId} not found`,
        false
      );
    }

    return ProposalStateMachine.validateTransition(
      proposal.status,
      'declined',
      command.context.actorId,
      proposal.proposingUserId,
      proposal.receivingUserId
    );
  }

  getRequiredCapabilities(): string[] {
    return ['decline_proposals'];
  }

  private async getProposal(id: string): Promise<Proposal> {
    return {} as Proposal;
  }
}

/**
 * Counter Proposal Command
 */
export interface CounterProposalCommand extends Command {
  commandType: 'counter_proposal';
  aggregateId: string; // proposal ID
  context: CommandContext;
  counterTerms: {
    proposedDate?: string;
    duration?: string;
    frequency?: string;
    locationMethod?: string;
    message?: string;
  };
}

export class CounterProposalHandler {
  async execute(command: CounterProposalCommand): Promise<CommandResult<Proposal>> {
    const proposal = await this.getProposal(command.aggregateId);
    
    const stateError = ProposalStateMachine.validateTransition(
      proposal.status,
      'countered',
      command.context.actorId,
      proposal.proposingUserId,
      proposal.receivingUserId
    );

    if (stateError) {
      return createErrorResult(stateError);
    }

    // Execute atomic transaction:
    // 1. Update proposal status to 'countered'
    // 2. Update counter terms
    // 3. Record audit event
    // 4. Emit proposal_countered event

    return createSuccessResult(proposal, 'event-id', 'audit-id');
  }

  async validate(command: CounterProposalCommand): Promise<DomainError | null> {
    const proposal = await this.getProposal(command.aggregateId);
    
    if (!proposal) {
      return createDomainError(
        'PROPOSAL_NOT_FOUND',
        `Proposal ${command.aggregateId} not found`,
        false
      );
    }

    return ProposalStateMachine.validateTransition(
      proposal.status,
      'countered',
      command.context.actorId,
      proposal.proposingUserId,
      proposal.receivingUserId
    );
  }

  getRequiredCapabilities(): string[] {
    return ['counter_proposals'];
  }

  private async getProposal(id: string): Promise<Proposal> {
    return {} as Proposal;
  }
}

/**
 * Command registry for proposal commands
 */
export class ProposalCommandRegistry {
  private handlers = new Map<string, any>();

  constructor() {
    this.registerHandler('create_proposal', new CreateProposalHandler());
    this.registerHandler('withdraw_proposal', new WithdrawProposalHandler());
    this.registerHandler('accept_proposal', new AcceptProposalHandler());
    this.registerHandler('decline_proposal', new DeclineProposalHandler());
    this.registerHandler('counter_proposal', new CounterProposalHandler());
  }

  registerHandler(commandType: string, handler: any): void {
    this.handlers.set(commandType, handler);
  }

  getHandler(commandType: string): any {
    const handler = this.handlers.get(commandType);
    if (!handler) {
      throw new Error(`No handler registered for command type: ${commandType}`);
    }
    return handler;
  }

  async execute(command: Command): Promise<CommandResult> {
    const handler = this.getHandler(command.commandType);
    
    // Validate capabilities
    const requiredCapabilities = handler.getRequiredCapabilities();
    // Check capabilities here using CapabilityService
    
    // Validate command
    const validationError = await handler.validate(command);
    if (validationError) {
      return createErrorResult(validationError);
    }

    // Execute command
    return await handler.execute(command);
  }
}