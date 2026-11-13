import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { routes } from '@/lib/routes'

export function OwnerListingNextSteps({ kind }: { kind: 'Need' | 'Offer' }) {
  return (
    <Card aria-label="Your listing next steps">
      <CardHeader>
        <CardTitle className="text-lg">What happens next?</CardTitle>
        <CardDescription>
          Your {kind} is visible to other members when active. Another member can pair it with
          their {kind === 'Need' ? 'Offer' : 'Need'} and send a proposal for you to consider.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Review incoming proposals before agreeing to connect, or explore the community to find other ways to participate.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link href={routes.member.proposals}>Review Proposals</Link></Button>
          <Button asChild variant="outline"><Link href={routes.member.discover}>Explore Discover</Link></Button>
        </div>
      </CardContent>
    </Card>
  )
}
