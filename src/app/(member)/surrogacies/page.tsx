import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-bold">Connections</h1><p className="text-muted-foreground">Established relationships created from accepted proposals.</p></div>
        <Button asChild variant="outline"><Link href="/proposals">View Proposals</Link></Button>
      </div>
      {surrogacies?.length ? (
        <div className="grid gap-4">
          {surrogacies.map((item) => (
            <Card key={item.id}>
              <CardHeader><div className="flex items-center gap-2"><CardTitle>Connection</CardTitle><Badge>{item.status}</Badge></div></CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Started {formatDate(item.started_at)}</p><Button asChild><Link href={`/surrogacies/${item.id}`}>Open</Link></Button></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="py-10 text-center"><p className="text-muted-foreground">No active relationship yet. Accepting a proposal creates one atomically.</p><Button asChild className="mt-4"><Link href="/discover">Discover</Link></Button></CardContent></Card>
      )}
    </div>
  )
}
