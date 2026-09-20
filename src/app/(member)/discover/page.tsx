import Link from 'next/link'
import { Handshake, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/infrastructure/supabase/server'
import { routes } from '@/lib/routes'

export default async function DiscoverPage() {
  const supabase = await createClient()
  const [needsResult, offersResult] = await Promise.all([
    supabase.from('needs').select('id,title,description,category,user_id,user_name,created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(24),
    supabase.from('offers').select('id,title,description,category,user_id,user_name,rating,review_count,created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(24),
  ])

  if (needsResult.error) throw new Error(`Failed to load needs: ${needsResult.error.message}`)
  if (offersResult.error) throw new Error(`Failed to load offers: ${offersResult.error.message}`)

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold">Discover</h1><p className="text-muted-foreground">Live Needs and Offers. Open a listing to create a real proposal.</p></div>
        <div className="flex gap-2"><Button asChild variant="outline"><Link href="/needs/create">Create Need</Link></Button><Button asChild><Link href="/offers/create">Create Offer</Link></Button></div>
      </div>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Heart className="h-5 w-5" />Needs</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(needsResult.data ?? []).map((need) => (
            <Card key={need.id}>
              <CardHeader><Badge className="w-fit" variant="outline">{need.category}</Badge><CardTitle>{need.title}</CardTitle><CardDescription>Requested by <Link className="underline" href={routes.memberDynamic.profile(need.user_id)}>{need.user_name}</Link></CardDescription></CardHeader>
              <CardContent><p className="line-clamp-4">{need.description}</p></CardContent>
              <CardFooter><Button asChild variant="outline"><Link href={routes.memberDynamic.need(need.id)}>View Need</Link></Button></CardFooter>
            </Card>
          ))}
        </div>
        {!needsResult.data?.length && <p className="text-muted-foreground">No active Needs are currently available.</p>}
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Handshake className="h-5 w-5" />Offers</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(offersResult.data ?? []).map((offer) => (
            <Card key={offer.id}>
              <CardHeader><Badge className="w-fit" variant="outline">{offer.category}</Badge><CardTitle>{offer.title}</CardTitle><CardDescription>Offered by <Link className="underline" href={routes.memberDynamic.profile(offer.user_id)}>{offer.user_name}</Link></CardDescription></CardHeader>
              <CardContent><p className="line-clamp-4">{offer.description}</p>{typeof offer.rating === 'number' && <p className="mt-3 text-sm text-muted-foreground">{offer.rating.toFixed(1)} rating · {offer.review_count ?? 0} reviews</p>}</CardContent>
              <CardFooter><Button asChild variant="outline"><Link href={routes.memberDynamic.offer(offer.id)}>View Offer</Link></Button></CardFooter>
            </Card>
          ))}
        </div>
        {!offersResult.data?.length && <p className="text-muted-foreground">No active Offers are currently available.</p>}
      </section>
    </div>
  )
}
