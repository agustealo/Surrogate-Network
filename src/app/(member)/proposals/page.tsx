import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProposalActions } from '@/components/proposals/ProposalActions'
import { createClient } from '@/infrastructure/supabase/server'
import { SupabaseProposalRepository } from '@/infrastructure/supabase/repositories/SupabaseProposalRepository'
import { routes } from '@/lib/routes'

export default async function ProposalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(routes.public.login)

  const proposals = await new SupabaseProposalRepository().findForUser(user.id)
  const needIds = [...new Set(proposals.map((proposal) => proposal.needId))]
  const offerIds = [...new Set(proposals.map((proposal) => proposal.offerId))]

  const [needsResult, offersResult] = await Promise.all([
    needIds.length ? supabase.from('needs').select('id,title,user_name').in('id', needIds) : Promise.resolve({ data: [], error: null }),
    offerIds.length ? supabase.from('offers').select('id,title,user_name').in('id', offerIds) : Promise.resolve({ data: [], error: null }),
  ])

  if (needsResult.error) throw new Error(`Failed to load proposal Needs: ${needsResult.error.message}`)
  if (offersResult.error) throw new Error(`Failed to load proposal Offers: ${offersResult.error.message}`)

  const needs = new Map((needsResult.data ?? []).map((need) => [need.id, need]))
  const offers = new Map((offersResult.data ?? []).map((offer) => [offer.id, offer]))

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-bold">Proposals</h1><p className="text-muted-foreground">Incoming and outgoing pairing requests. State changes are server-authoritative.</p></div>
        <Button asChild variant="outline"><Link href="/discover">Find a connection</Link></Button>
      </div>

      {!proposals.length && (
        <Card><CardHeader><CardTitle>No proposals yet</CardTitle><CardDescription>Open a Need or Offer in Discover to pair it with one of your listings.</CardDescription></CardHeader></Card>
      )}

      <div className="space-y-4">
        {proposals.map((proposal) => {
          const need = needs.get(proposal.needId)
          const offer = offers.get(proposal.offerId)
          const direction = proposal.proposingUserId === user.id ? 'Outgoing' : 'Incoming'
          const isOpen = proposal.status === 'pending' || proposal.status === 'countered'

          return (
            <Card key={proposal.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2"><Badge variant={direction === 'Incoming' ? 'default' : 'secondary'}>{direction}</Badge><Badge variant="outline">{proposal.status}</Badge></div>
                <CardTitle className="text-xl">{need?.title ?? 'Need'} ↔ {offer?.title ?? 'Offer'}</CardTitle>
                <CardDescription>Need by {need?.user_name ?? 'member'} · Offer by {offer?.user_name ?? 'member'} · {new Date(proposal.createdAt).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><Link href={`/needs/${proposal.needId}`}>View Need</Link></Button><Button asChild size="sm" variant="outline"><Link href={`/offers/${proposal.offerId}`}>View Offer</Link></Button></div>
                {proposal.message && <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{proposal.message}</p>}
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  {proposal.proposedDate && <div><dt className="font-medium">Date / window</dt><dd className="text-muted-foreground">{proposal.proposedDate}</dd></div>}
                  {proposal.duration && <div><dt className="font-medium">Duration</dt><dd className="text-muted-foreground">{proposal.duration}</dd></div>}
                  {proposal.frequency && <div><dt className="font-medium">Frequency</dt><dd className="text-muted-foreground">{proposal.frequency}</dd></div>}
                  {proposal.locationMethod && <div><dt className="font-medium">Location / method</dt><dd className="text-muted-foreground">{proposal.locationMethod}</dd></div>}
                </dl>
                {isOpen && (
                  <ProposalActions
                    proposalId={proposal.id}
                    status={proposal.status}
                    currentUserId={user.id}
                    proposingUserId={proposal.proposingUserId}
                    receivingUserId={proposal.receivingUserId}
                    counteredByUserId={proposal.counteredByUserId}
                  />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
