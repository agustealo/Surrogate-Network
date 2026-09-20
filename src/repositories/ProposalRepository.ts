import type { ProposalStatus } from '@/infrastructure/supabase/database.types'

export interface ProposalRecord {
  id: string
  needId: string
  offerId: string
  proposingUserId: string
  receivingUserId: string
  proposedDate?: string
  duration?: string
  frequency?: string
  locationMethod?: string
  message?: string
  status: ProposalStatus
  counteredByUserId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateProposalDto {
  needId: string
  offerId: string
  proposingUserId: string
  receivingUserId: string
  proposedDate?: string
  duration?: string
  frequency?: string
  locationMethod?: string
  message?: string
}

export interface CounterProposalDto {
  message?: string
  proposedDate?: string
  duration?: string
  frequency?: string
  locationMethod?: string
}

export interface ProposalRepository {
  findById(id: string): Promise<ProposalRecord | null>
  findForUser(userId: string, limit?: number): Promise<ProposalRecord[]>
  create(input: CreateProposalDto): Promise<ProposalRecord>
  accept(id: string, actorId: string): Promise<string>
  decline(id: string, actorId: string): Promise<void>
  withdraw(id: string, actorId: string): Promise<void>
  counter(id: string, actorId: string, input: CounterProposalDto): Promise<void>
}
