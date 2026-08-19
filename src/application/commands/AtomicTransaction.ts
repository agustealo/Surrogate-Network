// Atomic Transaction Pattern Implementation
// Provides a foundation for complex multi-step business operations

import { createDomainError, createSuccessResult, createErrorResult, type CommandResult, type DomainError, type ReasonCode } from './Command';
import type { Transaction } from './Command';

/**
 * Transaction step interface
 */
export interface TransactionStep<TInput = any, TOutput = any> {
  name: string;
  execute: (input: TInput, tx: Transaction) => Promise<TOutput>;
  rollback?: (output: TOutput, tx: Transaction) => Promise<void>;
  required: boolean; // If true, failure prevents subsequent steps
}

/**
 * Transaction state
 */
export enum TransactionState {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}

/**
 * Transaction execution result
 */
export interface TransactionResult {
  state: TransactionState;
  steps: Map<string, StepResult>;
  error?: DomainError;
  rollbackError?: DomainError;
}

/**
 * Individual step result
 */
export interface StepResult {
  executed: boolean;
  output?: any;
  error?: DomainError;
  rollbackExecuted: boolean;
  rollbackError?: DomainError;
}

/**
 * Atomic transaction executor
 */
export class AtomicTransaction<TInput = any, TFinalOutput = any> {
  private steps: TransactionStep<any, any>[] = [];
  private stepResults: Map<string, StepResult> = new Map();
  private state: TransactionState = TransactionState.NOT_STARTED;
  private context: Map<string, any> = new Map();

  constructor(
    private name: string,
    private transactionManager: () => Promise<Transaction>
  ) {}

  /**
   * Add a step to the transaction
   */
  addStep<TInput, TOutput>(
    step: TransactionStep<TInput, TOutput>
  ): AtomicTransaction<TInput, TOutput> {
    this.steps.push(step);
    return this as unknown as AtomicTransaction<TInput, TOutput>;
  }

  /**
   * Execute the transaction atomically
   */
  async execute(input: TInput): Promise<CommandResult<TFinalOutput>> {
    try {
      this.state = TransactionState.IN_PROGRESS;
      this.context.set('input', input);

      const tx = await this.transactionManager();

      // Execute steps in order
      for (const step of this.steps) {
        if (this.state !== TransactionState.IN_PROGRESS) {
          break; // Stop if transaction already failed/rolled back
        }

        const stepResult = await this.executeStep(step, input, tx);
        this.stepResults.set(step.name, stepResult);

        if (!stepResult.executed && step.required) {
          // Required step failed - rollback
          await this.rollback(tx);
          const error = stepResult.error || createDomainError(
            'INVALID_STATE_TRANSITION',
            `Required step '${step.name}' failed`,
            false
          );
          return createErrorResult(error);
        }
      }

      // All steps executed successfully - commit
      await tx.commit();
      this.state = TransactionState.COMPLETED;

      return createSuccessResult(
        this.context.get('finalOutput') as TFinalOutput
      );

    } catch (error) {
      this.state = TransactionState.FAILED;
      const domainError = this.convertToDomainError(error);
      
      try {
        const tx = await this.transactionManager();
        await this.rollback(tx);
      } catch (rollbackError) {
        return createErrorResult({
          ...domainError,
          details: {
            ...domainError.details,
            rollbackError: String(rollbackError),
          },
        });
      }

      return createErrorResult(domainError);
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep<TInput, TOutput>(
    step: TransactionStep<TInput, TOutput>,
    input: TInput,
    tx: Transaction
  ): Promise<StepResult> {
    const result: StepResult = {
      executed: false,
      rollbackExecuted: false,
    };

    try {
      const output = await step.execute(input, tx);
      result.executed = true;
      result.output = output;
      
      // Store output in context for subsequent steps
      this.context.set(step.name, output);
      
      return result;
    } catch (error) {
      result.error = this.convertToDomainError(error);
      return result;
    }
  }

  /**
   * Rollback all executed steps in reverse order
   */
  private async rollback(tx: Transaction): Promise<void> {
    this.state = TransactionState.ROLLED_BACK;

    // Rollback steps in reverse order
    for (let i = this.steps.length - 1; i >= 0; i--) {
      const step = this.steps[i];
      const stepResult = this.stepResults.get(step.name);

      if (stepResult?.executed && step.rollback) {
        try {
          await step.rollback(stepResult.output, tx);
          stepResult.rollbackExecuted = true;
        } catch (error) {
          stepResult.rollbackError = this.convertToDomainError(error);
          // Continue rolling back remaining steps even if one fails
        }
      }
    }

    await tx.rollback();
  }

  /**
   * Convert any error to DomainError
   */
  private convertToDomainError(error: any): DomainError {
    if (this.isDomainError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return createDomainError(
        'DATABASE_ERROR',
        error.message,
        false,
        { originalError: error.name }
      );
    }

    return createDomainError(
      'INVALID_STATE_TRANSITION',
      String(error),
      false
    );
  }

  /**
   * Type guard for DomainError
   */
  private isDomainError(error: any): error is DomainError {
    return (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      'message' in error &&
      'recoverable' in error
    );
  }

  /**
   * Get transaction state
   */
  getState(): TransactionState {
    return this.state;
  }

  /**
   * Get step results
   */
  getStepResults(): Map<string, StepResult> {
    return new Map(this.stepResults);
  }

  /**
   * Get context value by key
   */
  getContextValue<T>(key: string): T | undefined {
    return this.context.get(key);
  }

  /**
   * Set context value
   */
  setContextValue<T>(key: string, value: T): void {
    this.context.set(key, value);
  }
}

/**
 * Builder pattern for creating atomic transactions
 */
export class TransactionBuilder<TInput = any, TFinalOutput = any> {
  private steps: TransactionStep<any, any>[] = [];

  /**
   * Add a step to the transaction
   */
  step<TInput, TOutput>(
    name: string,
    execute: (input: TInput, tx: Transaction) => Promise<TOutput>,
    rollback?: (output: TOutput, tx: Transaction) => Promise<void>,
    required: boolean = true
  ): TransactionBuilder<TInput, TOutput> {
    this.steps.push({
      name,
      execute,
      rollback,
      required,
    });
    return this as unknown as TransactionBuilder<TInput, TOutput>;
  }

  /**
   * Build the transaction
   */
  build(
    name: string,
    transactionManager: () => Promise<Transaction>
  ): AtomicTransaction<TInput, TFinalOutput> {
    const transaction = new AtomicTransaction<TInput, TFinalOutput>(
      name,
      transactionManager
    );

    for (const step of this.steps) {
      transaction.addStep(step);
    }

    return transaction;
  }
}

/**
 * Common transaction step templates
 */
export class TransactionSteps {
  /**
   * Create a database insert step
   */
  static createInsertStep<TData, TResult>(
    name: string,
    table: string,
    data: TData,
    executeInsert: (data: TData, tx: Transaction) => Promise<TResult>
  ): TransactionStep<TData, TResult> {
    return {
      name,
      execute: async (input, tx) => {
        return await executeInsert(data, tx);
      },
      rollback: async (output, tx) => {
        // Default rollback: delete by ID
        // Implementation depends on your database interface
      },
      required: true,
    };
  }

  /**
   * Create an audit recording step
   */
  static createAuditStep(
    name: string,
    recordAudit: (event: any, tx: Transaction) => Promise<string>
  ): TransactionStep<any, string> {
    return {
      name,
      execute: async (input, tx) => {
        return await recordAudit(input, tx);
      },
      required: false, // Audit failure shouldn't block business logic
    };
  }

  /**
   * Create an event publishing step
   */
  static createEventStep(
    name: string,
    publishEvent: (event: any, tx: Transaction) => Promise<void>
  ): TransactionStep<any, void> {
    return {
      name,
      execute: async (input, tx) => {
        await publishEvent(input, tx);
      },
      required: false, // Event publishing failure shouldn't block business logic
    };
  }

  /**
   * Create a validation step
   */
  static createValidationStep<TInput>(
    name: string,
    validate: (input: TInput) => Promise<DomainError | null>
  ): TransactionStep<TInput, void> {
    return {
      name,
      execute: async (input) => {
        const error = await validate(input);
        if (error) {
          throw error;
        }
        return undefined;
      },
      required: true,
    };
  }
}