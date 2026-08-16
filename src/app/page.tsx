
import Link from 'next/link';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { UserPlus, Sparkles, UsersRound, ArrowRight, CheckCircle, Zap, Brain, Handshake, Network } from 'lucide-react';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome - Surrogate Network',
  description: 'Find and offer support through needs-based connections on Surrogate Network.',
};

export default function HomePage() {
  const features = [
    {
      icon: <UserPlus className="h-10 w-10 text-primary group-hover:text-primary/90 transition-colors group-hover:scale-110" />,
      title: 'Craft Your Identity',
      description: 'Showcase your unique offerings and needs. Your detailed profile is the key to unlocking meaningful connections.',
      href: '/profile/create',
      cta: 'Build Profile',
    },
    {
      icon: <Brain className="h-10 w-10 text-primary group-hover:text-primary/90 transition-colors group-hover:scale-110" />,
      title: 'AI-Powered Need Definition',
      description: 'Articulate your needs with clarity. Our intelligent system suggests relevant tags for precise matching.',
      href: '/needs/create',
      cta: 'Define Needs',
    },
    {
      icon: <Network className="h-10 w-10 text-primary group-hover:text-primary/90 transition-colors group-hover:scale-110" />,
      title: 'Discover Connections',
      description: 'Explore a curated selection of individuals based on genuine compatibility of needs and offerings.',
      href: '/matches',
      cta: 'Find Matches',
    },
  ];

  const platformBenefits = [
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      text: 'Futuristic AI-Assisted Need Articulation',
    },
    {
      icon: <UsersRound className="h-6 w-6 text-primary" />,
      text: 'Multi-Dimensional & Contextual Matching',
    },
    {
      icon: <Handshake className="h-6 w-6 text-primary" />,
      text: 'Transparent "This for That" Exchanges',
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-primary" />,
      text: 'Build Authentic, Needs-Based Relationships',
    }
  ];

  return (
    <PageWrapper>
      <section className="py-16 md:py-24 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
          Forge <span className="text-primary">Meaningful</span> Connections.
          <br />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Redefined by Surrogate Network.</span>
        </h1>
        <p className="mt-8 max-w-3xl mx-auto text-lg text-muted-foreground sm:text-xl md:text-2xl">
          Experience a new paradigm of support on Surrogate Network, where shared needs and offerings create authentic, dynamic bonds. Welcome to the future of connection.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-6">
          <Button size="lg" className="px-10 py-6 text-lg shadow-lg hover:shadow-primary/30 transition-shadow" asChild>
            <Link href="/profile/create">Begin Your Journey</Link>
          </Button>
          <Button size="lg" variant="outline" className="px-10 py-6 text-lg" asChild>
            <Link href="/matches">Explore Potential</Link>
          </Button>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">Core Pillars of Connection</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="group flex flex-col shadow-xl hover:shadow-primary/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 rounded-xl overflow-hidden">
              <CardHeader className="items-center text-center p-8 bg-muted/30">
                <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full mb-4 transition-transform duration-300 ease-out group-hover:scale-110">
                  {feature.icon}
                </div>
                <CardTitle className="mt-4 text-2xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow text-center p-6">
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
              <CardFooter className="text-center p-6 mt-auto">
                <Button asChild variant="link" className="text-lg text-primary hover:text-primary/80">
                  <Link href={feature.href}>
                    {feature.cta} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <Card className="overflow-hidden shadow-2xl rounded-xl">
          <div className="lg:flex">
            <div className="lg:w-1/2">
              <Image
                src="https://placehold.co/800x600.png"
                alt="Abstract representation of interconnectedness and futuristic community"
                data-ai-hint="abstract network futuristic technology"
                width={800}
                height={600}
                className="h-full w-full object-cover min-h-[300px] lg:min-h-full"
              />
            </div>
            <div className="lg:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-card">
              <h2 className="text-4xl font-bold text-foreground mb-6">
                A New <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">Dimension</span> of Connection
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Surrogate Network pioneers a community where individuals openly express their needs and offer their unique abilities. Our platform is engineered to facilitate "this for that" exchanges, cultivating balanced and deeply supportive relationships.
              </p>
              <ul className="space-y-4 text-muted-foreground mb-8">
                {platformBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">{benefit.icon}</div>
                    <span className="text-base">{benefit.text}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="self-start text-lg px-8 py-3 shadow-md hover:shadow-primary/20 transition-shadow">
                <Link href="/profile/create">Join The Evolution</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </PageWrapper>
  );
}
