'use client';

import { useEffect, useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { 
  Heart, 
  Handshake, 
  MessageSquare, 
  Clock, 
  ArrowRight, 
  PlusCircle,
  Users,
  TrendingUp,
  Sparkles,
  Calendar,
  Star
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type MockNeed = {
  id: string;
  title: string;
  category: 'personal' | 'casual' | 'utilitarian_business';
  description: string;
  createdAt: string;
  proposals: number;
};

type MockOffer = {
  id: string;
  title: string;
  category: 'personal' | 'casual' | 'utilitarian_business';
  description: string;
  compatibility: number;
};

type MockSurrogacy = {
  id: string;
  partner: {
    name: string;
    avatarUrl?: string;
  };
  need: string;
  offer: string;
  status: 'active' | 'scheduled' | 'paused';
  nextMoment?: string;
  startedAt: string;
};

const mockNeeds: MockNeed[] = [
  {
    id: 'need-1',
    title: 'Deep conversation partner',
    category: 'personal',
    description: 'Looking for someone to explore life questions and philosophy',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    proposals: 2,
  },
  {
    id: 'need-2', 
    title: 'Cafe exploration companion',
    category: 'casual',
    description: 'Want to discover local coffee shops together',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    proposals: 1,
  },
];

const mockOffers: MockOffer[] = [
  {
    id: 'offer-1',
    title: 'Empathetic Listener',
    category: 'personal',
    description: 'Offering a calm space for you to share and be heard',
    compatibility: 94,
  },
  {
    id: 'offer-2',
    title: 'Creative Brainstorming',
    category: 'casual',
    description: 'Let's explore ideas together and spark creativity',
    compatibility: 87,
  },
];

const mockSurrogacies: MockSurrogacy[] = [
  {
    id: 'surrogacy-1',
    partner: {
      name: 'Jordan Smith',
      avatarUrl: 'https://placehold.co/100x100.png?text=JS',
    },
    need: 'Mindfulness Practice',
    offer: 'Guided Meditation',
    status: 'active',
    nextMoment: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
];

export default function MemberHomePage() {
  const [hasNeeds, setHasNeeds] = useState(true);
  const [hasOffers, setHasOffers] = useState(true);
  const [currentXP, setCurrentXP] = useState(4250);
  const [currentRank, setCurrentRank] = useState(7);

  const createEmptyState = (
    icon: React.ElementType,
    title: string,
    description: string,
    buttonText: string,
    buttonHref: string
  ) => (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          {React.createElement(icon, { className: "h-6 w-6 text-muted-foreground" })}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter className="justify-center">
        <Button variant="outline" asChild>
          <Link href={buttonHref}>{buttonText}</Link>
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">
          Your relationship landscape and activity overview
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Surrogacies Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Active Surrogacies
                </CardTitle>
                <CardDescription>Your current relationships</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/surrogacies">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {mockSurrogacies.length > 0 ? (
                <div className="space-y-4">
                  {mockSurrogacies.map((surrogacy) => (
                    <Card key={surrogacy.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={surrogacy.partner.avatarUrl} alt={surrogacy.partner.name} />
                            <AvatarFallback>{surrogacy.partner.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold">{surrogacy.partner.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Started {formatDistanceToNow(new Date(surrogacy.startedAt), { addSuffix: true })}
                                </p>
                              </div>
                              <Badge 
                                variant={surrogacy.status === 'active' ? 'default' : 'secondary'}
                                className="capitalize"
                              >
                                {surrogacy.status}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <Heart className="h-3.5 w-3.5 text-pink-500" />
                                <span>Need: {surrogacy.need}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Handshake className="h-3.5 w-3.5 text-purple-500" />
                                <span>Offer: {surrogacy.offer}</span>
                              </div>
                            </div>
                            {surrogacy.nextMoment && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  <span>Next moment: {new Date(surrogacy.nextMoment).toLocaleDateString()}</span>
                                </div>
                              </div>
                            )}
                            <div className="mt-3 flex gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/surrogacies/${surrogacy.id}`}>
                                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                                  Message
                                </Link>
                              </Button>
                              <Button size="sm" asChild>
                                <Link href={`/surrogacies/${surrogacy.id}`}>
                                  View Details <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                createEmptyState(
                  Heart,
                  "No Active Surrogacies Yet",
                  "Start building meaningful connections by finding compatible needs and offers",
                  "Find Connections",
                  "/discover"
                )
              )}
            </CardContent>
          </Card>

          {/* Needs Looking for Someone */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  Your Needs
                </CardTitle>
                <CardDescription>What you're looking for</CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href="/needs/create">
                  <PlusCircle className="mr-1.5 h-4 w-4" />
                  Create Need
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {hasNeeds ? (
                <div className="space-y-4">
                  {mockNeeds.map((need) => (
                    <Card key={need.id} className="border-l-4 border-l-pink-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{need.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{need.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Posted {formatDistanceToNow(new Date(need.createdAt), { addSuffix: true })}</span>
                              <Badge variant="outline" className="text-xs">
                                {need.proposals} {need.proposals === 1 ? 'proposal' : 'proposals'}
                              </Badge>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/needs/${need.id}`}>
                              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                              View Responses
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                createEmptyState(
                  Heart,
                  "Your network starts with one Need",
                  "Tell Surrogate something you'd enjoy having more of in your life",
                  "Create My First Need",
                  "/needs/create"
                )
              )}
            </CardContent>
          </Card>

          {/* People Who May Need You */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Discover Opportunities
                </CardTitle>
                <CardDescription>Needs that match your offers</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/discover">Explore More</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {hasOffers ? (
                <div className="space-y-4">
                  {mockOffers.map((offer) => (
                    <Card key={offer.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{offer.title}</h3>
                              <div className="flex items-center gap-1.5">
                                <Star className="h-3.5 w-3.5 text-yellow-500" />
                                <span className="text-sm font-semibold">{offer.compatibility}% compatible</span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{offer.description}</p>
                          </div>
                          <Button size="sm" asChild>
                            <Link href="/discover">
                              View Details <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                createEmptyState(
                  Sparkles,
                  "What can someone count on you for?",
                  "Create an Offer and let the network know what you genuinely enjoy giving",
                  "Create My First Offer",
                  "/offers/create"
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Progress Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-end mb-1">
                  <p className="font-bold text-lg">Rank {currentRank}</p>
                  <p className="text-sm text-muted-foreground font-mono">{currentXP.toLocaleString()} / 5,000 XP</p>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Next Unlock at Rank 8:</span> Enhanced profile customization
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/rewards">View Rank Details</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Surrogacies</span>
                <span className="font-semibold">{mockSurrogacies.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Open Needs</span>
                <span className="font-semibold">{mockNeeds.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Offers</span>
                <span className="font-semibold">{mockOffers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Proposals</span>
                <span className="font-semibold">2</span>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started */}
          {(!hasNeeds || !hasOffers) && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground mb-3">
                  Complete these steps to enhance your experience:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                      hasNeeds ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {hasNeeds ? "✓" : "1"}
                    </div>
                    <span className={cn(hasNeeds ? "line-through text-muted-foreground" : "")}>
                      Create your first Need
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                      hasOffers ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {hasOffers ? "✓" : "2"}
                    </div>
                    <span className={cn(hasOffers ? "line-through text-muted-foreground" : "")}>
                      Create your first Offer
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}