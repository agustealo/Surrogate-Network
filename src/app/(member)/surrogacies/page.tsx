import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/infrastructure/supabase/server'

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : 'date unavailable'
}

export default async function MemberSurrogaciesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: surrogacies, error } = await supabase
    .from('surrogacies')
    .select('id,status,started_at,ended_at,need_id,offer_id')
    .contains('partner_ids', [user!.id])
    .order('started_at', { ascending: false })

  if (error) throw new Error('Unable to load your connections.')

  const connections = surrogacies ?? []
  const needIds = [...new Set(connections.map((item) => item.need_id))]
  const offerIds = [...new Set(connections.map((item) => item.offer_id))]

  const [needsResult, offersResult] = await Promise.all([
    needIds.length
      ? supabase.from('needs').select('id,title').in('id', needIds)
      : Promise.resolve({ data: [], error: null }),
    offerIds.length
      ? supabase.from('offers').select('id,title').in('id', offerIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (needsResult.error) throw new Error(`Unable to load connection Needs: ${needsResult.error.message}`)
  if (offersResult.error) throw new Error(`Unable to load connection Offers: ${offersResult.error.message}`)

  const needTitles = new Map((needsResult.data ?? []).map((need) => [need.id, need.title]))
  const offerTitles = new Map((offersResult.data ?? []).map((offer) => [offer.id, offer.title]))

  for (const connection of connections) {
    if (!needTitles.has(connection.need_id) || !offerTitles.has(connection.offer_id)) {
      throw new Error('Connection references an unavailable Need or Offer.')
    }
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-bold">Connections</h1><p className="text-muted-foreground">Established relationships created from accepted proposals.</p></div>
        <Button asChild variant="outline"><Link href="/proposals">View Proposals</Link></Button>
      </div>
      {connections.length ? (
        <div className="grid gap-4">
          {connections.map((item) => {
            const needTitle = needTitles.get(item.need_id)!
            const offerTitle = offerTitles.get(item.offer_id)!

            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2"><CardTitle>{needTitle} ↔ {offerTitle}</CardTitle><Badge>{item.status}</Badge></div>
                  <CardDescription>Established from the accepted Need and Offer.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Started {formatDate(item.started_at)}</p><Button asChild><Link href={`/surrogacies/${item.id}`}>Open</Link></Button></CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card><CardContent className="py-10 text-center"><p className="text-muted-foreground">No active relationship yet. Accepting a proposal creates one atomically.</p><Button asChild className="mt-4"><Link href="/discover">Discover</Link></Button></CardContent></Card>
      )}
    </div>
  )
}
