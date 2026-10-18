import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Compass, Gift, HandHeart, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/infrastructure/supabase/server'
import { routes } from '@/lib/routes'

export default async function CreateProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(routes.public.login)

  const [profileResult, needsResult, offersResult] = await Promise.all([
    supabase.from('profiles').select('id,name').eq('id', user.id).maybeSingle(),
    supabase.from('needs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('offers').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  if (profileResult.error || needsResult.error || offersResult.error) {
    throw new Error('Unable to load your getting-started information.')
  }

  const hasListing = (needsResult.count ?? 0) + (offersResult.count ?? 0) > 0

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Getting started</p>
        <h1 className="text-3xl font-bold">Welcome{profileResult.data?.name ? `, ${profileResult.data.name}` : ''}</h1>
        <p className="max-w-2xl text-muted-foreground">
          Surrogate Network helps people connect through things they need and things they can offer.
          Choose the next step that feels right to you. You can always come back later.
        </p>
      </header>

      {hasListing && (
        <Card>
          <CardHeader>
            <CardTitle>You've already started</CardTitle>
            <CardDescription>Your Need or Offer has been created. Explore other members' listings or return to your network.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild><Link href={routes.member.discover}>Discover connections</Link></Button>
            <Button asChild variant="outline"><Link href={routes.member.home}>Go to your network</Link></Button>
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="choose-first-step" className="space-y-4">
        <h2 id="choose-first-step" className="text-xl font-semibold">What would you like to do first?</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <HandHeart className="mb-2 h-7 w-7 text-primary" aria-hidden="true" />
              <CardTitle>I need something</CardTitle>
              <CardDescription>Describe the help, companionship, or shared experience you're looking for.</CardDescription>
            </CardHeader>
            <CardContent><Button asChild><Link href={routes.member.needsCreate}>Share a Need</Link></Button></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Gift className="mb-2 h-7 w-7 text-primary" aria-hidden="true" />
              <CardTitle>I can offer something</CardTitle>
              <CardDescription>Tell others how you're willing to help, share a skill, or spend time together.</CardDescription>
            </CardHeader>
            <CardContent><Button asChild><Link href={routes.member.offersCreate}>Create an Offer</Link></Button></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Compass className="mb-2 h-7 w-7 text-primary" aria-hidden="true" />
              <CardTitle>I'd rather look around</CardTitle>
              <CardDescription>Explore real Needs and Offers before deciding what to share.</CardDescription>
            </CardHeader>
            <CardContent><Button asChild variant="outline"><Link href={routes.member.discover}>Explore connections</Link></Button></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <UserRound className="mb-2 h-7 w-7 text-primary" aria-hidden="true" />
              <CardTitle>Review my profile</CardTitle>
              <CardDescription>See the identity other members will encounter and review your account settings.</CardDescription>
            </CardHeader>
            <CardContent><Button asChild variant="outline"><Link href={routes.member.profile}>View my profile</Link></Button></CardContent>
          </Card>
        </div>
      </section>

      <p className="text-sm text-muted-foreground">
        A connection only begins after a proposal is accepted. You decide which Needs or Offers to publish.
      </p>
      <Button asChild variant="ghost"><Link href={routes.member.home}>Skip for now</Link></Button>
    </div>
  )
}
