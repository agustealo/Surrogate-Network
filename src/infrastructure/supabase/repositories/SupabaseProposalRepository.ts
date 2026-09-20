import { createClient, createServiceClient } from '@/infrastructure/supabase/server'
import type { Database, ProposalStatus } from '@/infrastructure/supabase/database.types'
import type {
  CounterProposalDto,
  CreateProposalDto,
  ProposalRecord,
  ProposalRepository,
} from '@/repositories/ProposalRepository'

type ProposalRow = Database['public']['Tables']['proposals']['Row'] & {
  countered_by_user_id?: string | null
}

type RpcResponse<T> = {
  data: T | null
  error: { message: string } | null
}

type TrialRpcClient = {
  rpc<T>(name: string, args: Record<string, unknown>): PromiseLike<RpcResponse<T>>
}

export class SupabaseProposalRepository implements ProposalRepository {
  async findById(id: string): Promise<ProposalRecord | null> {
    const supabase = await createClient()
    const { data, error } = await supabase.from('proposals').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(`Failed to load proposal: ${error.message}`)
    return data ? this.mapRow(data as ProposalRow) : null
  }

  async findForUser(userId: string, limit = 100): Promise<ProposalRecord[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .or(`proposing_user_id.eq.${userId},receiving_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`Failed to load proposals: ${error.message}`)
    return (data ?? []).map((row) => this.mapRow(row as ProposalRow))
  }

  async create(input: CreateProposalDto): Promise<ProposalRecord> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        need_id: input.needId,
        offer_id: input.offerId,
        proposing_user_id: input.proposingUserId,
        receiving_user_id: input.receivingUserId,
        proposed_date: input.proposedDate,
        duration: input.duration,
        frequency: input.frequency,
        location_method: input.locationMethod,
        message: input.message,
        status: 'pending',
      })
      .select('*')
      .single()

    if (error) throw new Error(`Failed to create proposal: ${error.message}`)
    return this.mapRow(data as ProposalRow)
  }

  async accept(id: string, actorId: string): Promise<string> {
    const rpc = createServiceClient() as unknown as TrialRpcClient
    const { data, error } = await rpc.rpc<string>('accept_proposal_for_trial', {
      p_proposal_id: id,
      p_actor_id: actorId,
    })
    if (error || !data) throw new Error(error?.message ?? 'Proposal acceptance did not create a relationship')
    return data
  }

  async decline(id: string, actorId: string): Promise<void> {
    await this.transition(id, actorId, 'declined')
  }

  async withdraw(id: string, actorId: string): Promise<void> {
    await this.transition(id, actorId, 'withdrawn')
  }

  async counter(id: string, actorId: string, input: CounterProposalDto): Promise<void> {
    await this.transition(id, actorId, 'countered', input)
  }

  private async transition(
    id: string,
    actorId: string,
    status: Extract<ProposalStatus, 'declined' | 'countered' | 'withdrawn'>,
    input: CounterProposalDto = {},
  ): Promise<void> {
    const rpc = createServiceClient() as unknown as TrialRpcClient
    const { error } = await rpc.rpc<ProposalStatus>('transition_proposal_for_trial', {
      p_proposal_id: id,
      p_actor_id: actorId,
      p_new_status: status,
      p_message: input.message ?? null,
      p_proposed_date: input.proposedDate ?? null,
      p_duration: input.duration ?? null,
      p_frequency: input.frequency ?? null,
      p_location_method: input.locationMethod ?? null,
    })
    if (error) throw new Error(`Failed to ${status} proposal: ${error.message}`)
  }

  private mapRow(row: ProposalRow): ProposalRecord {
    return {
      id: row.id,
      needId: row.need_id,
      offerId: row.offer_id,
      proposingUserId: row.proposing_user_id,
      receivingUserId: row.receiving_user_id,
      proposedDate: row.proposed_date ?? undefined,
      duration: row.duration ?? undefined,
      frequency: row.frequency ?? undefined,
      locationMethod: row.location_method ?? undefined,
      message: row.message ?? undefined,
      status: row.status,
      counteredByUserId: row.countered_by_user_id ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
