import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeartHandshake, Shield, Star, MessageCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Surrogate Companion - Meaningful Connections',
  description: 'Find meaningful connections through needs-based relationships. Discover what you need, offer what you can give.',
};

export default function PublicHomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative py-20 lg:py-32 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/20 rounded-full">
              <HeartHandshake className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Meaningful Connections
            <br />
            <span className="text-primary">Through Needs-Based Relationships</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Discover what you need, offer what you can give, and build relationships 
            that enrich both lives. Join a community focused on genuine connection and mutual growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link href="/join">
                Join Surrogate Companion
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link href="/how-it-works">
                Learn How It Works
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Surrogate Companion Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Share What You Need</CardTitle>
                <CardDescription>
                  Express your authentic needs - from conversation partners to skill sharing
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Offer What You Can Give</CardTitle>
                <CardDescription>
                  Share your strengths and gifts - what you genuinely enjoy providing to others
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <HeartHandshake className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Build Meaningful Connections</CardTitle>
                <CardDescription>
                  Form surrogacy relationships based on genuine needs and mutual respect
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Surrogate Companion?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Safe & Respectful</h3>
                <p className="text-sm text-muted-foreground">
                  Built on clear boundaries, consent, and community safety standards
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MessageCircle className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Authentic Communication</h3>
                <p className="text-sm text-muted-foreground">
                  Focus on real needs and genuine connection rather than superficial traits
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <TrendingUp className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Growth-Oriented</h3>
                <p className="text-sm text-muted-foreground">
                  Relationships that help both parties learn, grow, and develop
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Find Meaningful Connections?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Join thousands building authentic relationships based on genuine needs and mutual respect.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link href="/join">
                Create Your Free Profile
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link href="/explore">
                Explore Without Signing Up
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}