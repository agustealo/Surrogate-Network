import Link from 'next/link'
import { BookOpen, Heart, LogIn, Network, Shield, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BRAND_HOME_LABEL, BRAND_NAME } from '@/lib/brand'
import { routes } from '@/lib/routes'

export function PublicNavigation() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex min-h-16 flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
        <Link href={routes.public.home} className="flex items-center gap-2" aria-label={BRAND_HOME_LABEL}>
          <Network className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-foreground">{BRAND_NAME}</span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.public.home} className="flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild><Link href={routes.public.howItWorks}>How It Works</Link></Button>
          <Button variant="ghost" size="sm" asChild><Link href={routes.public.explore}>Explore</Link></Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.public.principles} className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Principles
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.public.safety} className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              Safety
            </Link>
          </Button>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.public.login} className="flex items-center gap-1.5">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
              <span className="sr-only sm:hidden">Sign In</span>
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={routes.public.signup} className="flex items-center gap-1.5">
              <UserPlus className="h-4 w-4" />
              Join
            </Link>
          </Button>
        </div>

        <nav aria-label="Mobile primary navigation" className="order-last flex w-full items-center gap-1 overflow-x-auto border-t pt-2 md:hidden">
          <Button variant="ghost" size="sm" asChild><Link href={routes.public.home}>Home</Link></Button>
          <Button variant="ghost" size="sm" asChild><Link href={routes.public.howItWorks}>How It Works</Link></Button>
          <Button variant="ghost" size="sm" asChild><Link href={routes.public.explore}>Explore</Link></Button>
          <Button variant="ghost" size="sm" asChild><Link href={routes.public.safety}>Safety</Link></Button>
        </nav>
      </div>
    </header>
  )
}
