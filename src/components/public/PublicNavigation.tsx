import Link from 'next/link';
import { Network, Heart, BookOpen, Shield, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PublicNavigation() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Network className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            Surrogate Companion
          </h1>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/how-it-works" className="flex items-center gap-1.5">
              How It Works
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/explore" className="flex items-center gap-1.5">
              Explore
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/principles" className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Principles
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/safety" className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              Safety
            </Link>
          </Button>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login" className="flex items-center gap-1.5">
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/join" className="flex items-center gap-1.5">
              <UserPlus className="h-4 w-4" />
              Join
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}