import type { Metadata } from 'next';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeartHandshake, Shield, Star, MessageCircle, TrendingUp, Heart } from 'lucide-react';
import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Surrogate Network - Meaningful Connections',
  description: 'Find meaningful connections through needs-based relationships. Discover what you need, offer what you can give.',
};

export default function PublicHomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative bg-gradient-to-b from-primary/10 to-background py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/20 p-4">
              <HeartHandshake className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="mb-6 text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl">
            Meaningful Connections
            <br />
            <span className="text-primary">Through Needs-Based Relationships</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground">
            Discover what you need, offer what you can give, and build relationships
            that enrich both lives. Join a community focused on genuine connection and mutual growth.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="px-8 text-lg">
              <Link href={routes.public.signup}>Join {BRAND_NAME}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="px-8 text-lg">
              <Link href={routes.public.howItWorks}>Learn How It Works</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold">How {BRAND_NAME} Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-2 text-center transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Share What You Need</CardTitle>
                <CardDescription>Express your authentic needs, from conversation partners to skill sharing.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 text-center transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Offer What You Can Give</CardTitle>
                <CardDescription>Share your strengths and what you genuinely enjoy providing to others.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 text-center transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <HeartHandshake className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Build Meaningful Connections</CardTitle>
                <CardDescription>Form Surrogacy relationships based on explicit Needs, Offers, consent, and mutual respect.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold">Why {BRAND_NAME}?</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-4">
              <Shield className="mt-1 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h3 className="mb-1 font-semibold">Consent & boundaries</h3>
                <p className="text-sm text-muted-foreground">Needs, Offers, proposals, blocking, and reporting are backed by explicit persisted controls.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MessageCircle className="mt-1 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h3 className="mb-1 font-semibold">Explicit proposals</h3>
                <p className="text-sm text-muted-foreground">A connection is created only after a real Need/Offer proposal is accepted by the other member.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <TrendingUp className="mt-1 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h3 className="mb-1 font-semibold">Exchange history</h3>
                <p className="text-sm text-muted-foreground">Scheduled Moments, completed Exchanges, and feedback create a concrete relationship history.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-bold">Ready to Try a Needs-Based Connection?</h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground">
            Join the consumer trial to publish a Need or Offer, create explicit proposals, and help us validate the experience.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="px-8 text-lg">
              <Link href={routes.public.signup}>Create Your Trial Profile</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="px-8 text-lg">
              <Link href={routes.public.explore}>Explore Without Signing Up</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
