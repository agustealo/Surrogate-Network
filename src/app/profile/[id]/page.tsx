import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, ShieldCheck } from 'lucide-react'
import { ProfileSafetyControls } from '@/components/safety/ProfileSafetyControls'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/infrastructure/supabase/server'

type Props = { params: Promise<{ id: string }> }

export default async function ProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id,name,avatar_url,bio,location,availability,verification_status,rank')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(`Failed to load profile: ${error.message}`)
  if (!profile) notFound()

  const [needsResult, offersResult] = await Promise.all([
    supabase.from('needs').select('id,title,description,category').eq('user_id', id).eq('status', 'active').limit(12),
    supabase.from('offers').select('id,title,description,category,rating,review_count').eq('user_id', id).eq('status', 'active').limit(12),
  ])
  if (needsResult.error) throw new Error(`Failed to load profile needs: ${needsResult.error.message}`)
  if (offersResult.error) throw new Error(`Failed to load profile offers: ${offersResult.error.message}`)

  const isSelf = user?.id === profile.id

  return (
    <main className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      <Card>
        <CardContent className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-start">
          <Avatar className="h-24 w-24"><AvatarImage src={profile.avatar_url} alt={profile.name} /><AvatarFallback>{profile.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-bold">{profile.name}</h1>{profile.verification_status !== 'unverified' && <Badge variant="secondary"><ShieldCheck className="mr-1 h-3 w-3" />{profile.verification_status}</Badge>}</div>
            <p className="max-w-2xl text-muted-foreground">{profile.bio}</p>
            {profile.location && <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{profile.location}</p>}
            <p className="text-sm">Rank {profile.rank ?? 1}{profile.availability ? ` · ${profile.availability}` : ''}</p>
            {isSelf && <Button asChild size="sm" variant="outline"><Link href="/settings">Manage account</Link></Button>}
          </div>
        </CardContent>
      </Card>

      {!isSelf && user && <ProfileSafetyControls targetUserId={profile.id} targetName={profile.name} />}

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Needs</h2>
        <div className="grid gap-4 md:grid-cols-2">{(needsResult.data ?? []).map((need) => <Card key={need.id}><CardHeader><Badge className="w-fit" variant="outline">{need.category}</Badge><CardTitle>{need.title}</CardTitle></CardHeader><CardContent><p className="mb-4">{need.description}</p><Button asChild size="sm" variant="outline"><Link href={`/needs/${need.id}`}>View Need</Link></Button></CardContent></Card>)}</div>
        {!needsResult.data?.length && <p className="text-muted-foreground">No active Needs.</p>}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Offers</h2>
        <div className="grid gap-4 md:grid-cols-2">{(offersResult.data ?? []).map((offer) => <Card key={offer.id}><CardHeader><Badge className="w-fit" variant="outline">{offer.category}</Badge><CardTitle>{offer.title}</CardTitle></CardHeader><CardContent><p>{offer.description}</p>{typeof offer.rating === 'number' && <p className="mt-2 text-sm text-muted-foreground">{offer.rating.toFixed(1)} · {offer.review_count ?? 0} reviews</p>}<Button asChild size="sm" variant="outline" className="mt-4"><Link href={`/offers/${offer.id}`}>View Offer</Link></Button></CardContent></Card>)}</div>
        {!offersResult.data?.length && <p className="text-muted-foreground">No active Offers.</p>}
      </section>
    </main>
  )
}
