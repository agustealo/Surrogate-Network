import { Network } from 'lucide-react'
import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <Network className="h-6 w-6 text-primary" />
              <span className="font-bold text-foreground">Surrogate Network</span>
            </Link>
            <p className="max-w-xl text-sm text-muted-foreground">
              Build consent-based connections around explicit Needs and Offers. Consumer-trial features are exposed only when their persistence, permissions, and safety controls are deployed.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/how-it-works" className="transition-colors hover:text-foreground">How It Works</Link></li>
              <li><Link href="/explore" className="transition-colors hover:text-foreground">Explore</Link></li>
              <li><Link href="/principles" className="transition-colors hover:text-foreground">Principles</Link></li>
              <li><Link href="/safety" className="transition-colors hover:text-foreground">Safety</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Trial information</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="transition-colors hover:text-foreground">Privacy Notice</Link></li>
              <li><Link href="/terms" className="transition-colors hover:text-foreground">Trial Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Surrogate Network. Consumer trial.</p>
        </div>
      </div>
    </footer>
  )
}
