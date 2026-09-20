'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { actionFailure, requireActiveMember, type ActionResult } from '@/application/actions/memberContext'
import { createClient } from '@/infrastructure/supabase/server'
import { SupabaseNeedRepository } from '@/infrastructure/supabase/repositories/SupabaseNeedRepository'
import { SupabaseOfferRepository } from '@/infrastructure/supabase/repositories/SupabaseOfferRepository'
import { SupabaseProposalRepository } from '@/infrastructure/supabase/repositories/SupabaseProposalRepository'

const boundaries = ['platonic', 'romantic', 'physical', 'virtual', 'one-off', 'recurring'] as const
const categories = ['personal', 'utilitarian_business', 'casual'] as const
const locationModes = ['remote', 'local', 'either'] as const

const needSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(1000),
  category: z.enum(categories),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  locationMode: z.enum(locationModes),
  timing: z.string().trim().max(500).optional(),
  boundaries: z.array(z.enum(boundaries)).min(1),
  urgency: z.enum(['low', 'medium', 'high']).optional(),
})

const offerSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(1000),
  category: z.enum(categories),
  locationMode: z.enum(locationModes),
  timing: z.string().trim().max(500).optional(),
  boundaries: z.array(z.enum(boundaries)).min(1),
  capacity: z.number().int().min(1).max(50).optional(),
})

const proposalSchema = z.object({
  needId: z.string().uuid(),
  offerId: z.string().uuid(),
  message: z.string().trim().max(2000).optional(),
  proposedDate: z.string().trim().max(100).optional(),
  duration: z.string().trim().max(100).optional(),
  frequency: z.string().trim().max(100).optional(),
  locationMethod: z.string().trim().max(200).optional(),
})

const counterSchema = z.object({
  proposalId: z.string().uuid(),
  message: z.string().trim().max(2000).optional(),
  proposedDate: z.string().trim().max(100).optional(),
  duration: z.string().trim().max(100).optional(),
  frequency: z.string().trim().max(100).optional(),
  locationMethod: z.string().trim().max(200).optional(),
})

export type MarketplaceActionResult<T = undefined> = ActionResult<T>

export async function createNeedAction(input: unknown): Promise<MarketplaceActionResult<{ id: string }>> {
  try {
    const actor = await requireActiveMember()
    const values = needSchema.parse(input)
    const need = await new SupabaseNeedRepository().create({
      ...values,
      timing: values.timing || undefined,
      userId: actor.id,
      userName: actor.name,
      userAvatar: actor.avatarUrl,
    })
    revalidatePath('/needs')
    revalidatePath('/discover')
    return { ok: true, data: { id: need.id } }
  } catch (error) {
    return actionFailure(error)
  }
}

export async function createOfferAction(input: unknown): Promise<MarketplaceActionResult<{ id: string }>> {
  try {
    const actor = await requireActiveMember()
    const values = offerSchema.parse(input)
    const offer = await new SupabaseOfferRepository().create({
      ...values,
      timing: values.timing || undefined,
      userId: actor.id,
      userName: actor.name,
      userAvatar: actor.avatarUrl,
    })
    revalidatePath('/offers')
    revalidatePath('/discover')
    return { ok: true, data: { id: offer.id } }
  } catch (error) {
    return actionFailure(error)
  }
}

export async function createProposalAction(input: unknown): Promise<MarketplaceActionResult<{ id: string }>> {
  try {
    const actor = await requireActiveMember()
    const values = proposalSchema.parse(input)
    const supabase = await createClient()

    const [{ data: need, error: needError }, { data: offer, error: offerError }] = await Promise.all([
      supabase.from('needs').select('id,user_id,status').eq('id', values.needId).single(),
      supabase.from('offers').select('id,user_id,status').eq('id', values.offerId).single(),
    ])

    if (needError || !need || need.status !== 'active') throw new Error('That Need is no longer available.')
    if (offerError || !offer || offer.status !== 'active') throw new Error('That Offer is no longer available.')
    if (need.user_id === offer.user_id) throw new Error('A Need and Offer must belong to different members.')
    if (actor.id !== need.user_id && actor.id !== offer.user_id) throw new Error('You must own either the Need or the Offer in this proposal.')

    const receivingUserId = actor.id === need.user_id ? offer.user_id : need.user_id
    const { data: existing, error: existingError } = await supabase
      .from('proposals')
      .select('id,status')
      .eq('need_id', values.needId)
      .eq('offer_id', values.offerId)
      .in('status', ['pending', 'countered'])
      .maybeSingle()

    if (existingError) throw new Error(`Unable to verify proposal state: ${existingError.message}`)
    if (existing) throw new Error('An open proposal already exists for this Need and Offer.')

    const proposal = await new SupabaseProposalRepository().create({
      ...values,
      message: values.message || undefined,
      proposedDate: values.proposedDate || undefined,
      duration: values.duration || undefined,
      frequency: values.frequency || undefined,
      locationMethod: values.locationMethod || undefined,
      proposingUserId: actor.id,
      receivingUserId,
    })

    revalidatePath('/proposals')
    revalidatePath('/discover')
    return { ok: true, data: { id: proposal.id } }
  } catch (error) {
    return actionFailure(error)
  }
}

export async function acceptProposalAction(proposalId: string): Promise<MarketplaceActionResult<{ surrogacyId: string }>> {
  try {
    await requireActiveMember()
    const id = z.string().uuid().parse(proposalId)
    const surrogacyId = await new SupabaseProposalRepository().accept(id)
    revalidatePath('/proposals')
    revalidatePath('/surrogacies')
    revalidatePath('/discover')
    return { ok: true, data: { surrogacyId } }
  } catch (error) {
    return actionFailure(error)
  }
}

export async function declineProposalAction(proposalId: string): Promise<MarketplaceActionResult> {
  try {
    await requireActiveMember()
    const id = z.string().uuid().parse(proposalId)
    await new SupabaseProposalRepository().decline(id)
    revalidatePath('/proposals')
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}

export async function withdrawProposalAction(proposalId: string): Promise<MarketplaceActionResult> {
  try {
    await requireActiveMember()
    const id = z.string().uuid().parse(proposalId)
    await new SupabaseProposalRepository().withdraw(id)
    revalidatePath('/proposals')
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}

export async function counterProposalAction(input: unknown): Promise<MarketplaceActionResult> {
  try {
    await requireActiveMember()
    const values = counterSchema.parse(input)
    await new SupabaseProposalRepository().counter(values.proposalId, {
      message: values.message || undefined,
      proposedDate: values.proposedDate || undefined,
      duration: values.duration || undefined,
      frequency: values.frequency || undefined,
      locationMethod: values.locationMethod || undefined,
    })
    revalidatePath('/proposals')
    return { ok: true, data: undefined }
  } catch (error) {
    return actionFailure(error)
  }
}
