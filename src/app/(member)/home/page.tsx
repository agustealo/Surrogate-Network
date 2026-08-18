// Home page components
// Decomposed home page sections for maintainability

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Heart, Handshake, MessageSquare, ArrowRight, PlusCircle, Users, TrendingUp, Sparkles, Calendar, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { EmptyState, LoadingState, ErrorState, StatusBadge } from '@/components/shared';
import { formatRelativeTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { getDemoData } from '@/dev/fixtures';
import { routes } from '@/lib/routes';

type Need = {
  id: string;
  title: string;
  category: 'personal' | 'casual' | 'utilitarian_business';
  description: string;
  createdAt: string;
  proposals: number;
};

type Offer = {
  id: string;
  title: string;
  category: 'personal' | 'casual' | 'utilitarian_business';
  description: string;
  compatibility: number;
  userName: string;
  userAvatar?: string;
};

type Surrogacy = {
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

// Header component
function HomeHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
      <p className="text-muted-foreground">
        Your relationship landscape and activity overview
      </p>
    </div>
  );
}

// Active surrogacies section
interface ActiveSurrogaciesProps {
  surrogacies: Surrogacy[];
}

function ActiveSurrogacies({ surrogacies }: ActiveSurrogaciesProps) {
  if (surrogacies.length === 0) {
    return (
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
            <Link href={routes.member.surrogacies}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Heart}
            title="No Active Surrogacies Yet"
            description="Start building meaningful connections by finding compatible needs and offers"
            primaryAction={{
              label: "Find Connections",
              href: routes.member.discover,
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
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
          <Link href={routes.member.surrogacies}>View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {surrogacies.map((surrogacy) => (
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
                          Started {formatRelativeTime(surrogacy.startedAt)}
                        </p>
                      </div>
                      <StatusBadge status={surrogacy.status} />
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
                        <Link href={`${routes.member.surrogacies}/${surrogacy.id}`}>
                          <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                          Message
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`${routes.member.surrogacies}/${surrogacy.id}`}>
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
      </CardContent>
    </Card>
  );
}

// Your needs section
interface YourNeedsProps {
  needs: Need[];
  hasNeeds: boolean;
  onToggleHasNeeds?: () => void;
}

function YourNeeds({ needs, hasNeeds, onToggleHasNeeds }: YourNeedsProps) {
  return (
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
          <Link href={routes.member.needsCreate}>
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Create Need
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {hasNeeds ? (
          <div className="space-y-4">
            {needs.map((need) => (
              <Card key={need.id} className="border-l-4 border-l-pink-500">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{need.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{need.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Posted {formatRelativeTime(need.createdAt)}</span>
                        <Badge variant="outline" className="text-xs">
                          {need.proposals} {need.proposals === 1 ? 'proposal' : 'proposals'}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`${routes.member.needs}/${need.id}`}>
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
          <EmptyState
            icon={Heart}
            title="Your network starts with one Need"
            description="Tell Surrogate something you'd enjoy having more of in your life"
            primaryAction={{
              label: "Create My First Need",
              href: routes.member.needsCreate,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Discover opportunities section
interface DiscoverOpportunitiesProps {
  offers: Offer[];
  hasOffers: boolean;
  onToggleHasOffers?: () => void;
}

function DiscoverOpportunities({ offers, hasOffers }: DiscoverOpportunitiesProps) {
  return (
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
          <Link href={routes.member.discover}>Explore More</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {hasOffers ? (
          <div className="space-y-4">
            {offers.map((offer) => (
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
                      <Link href={routes.member.discover}>
                        View Details <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="What can someone count on you for?"
            description="Create an Offer and let the network know what you genuinely enjoy giving"
            primaryAction={{
              label: "Create My First Offer",
              href: routes.member.offersCreate,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Progress section
interface ProgressProps {
  currentXP: number;
  currentRank: number;
  maxXP: number;
}

function ProgressSection({ currentXP, currentRank, maxXP }: ProgressProps) {
  const progressPercentage = Math.min((currentXP / maxXP) * 100, 100);

  return (
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
            <p className="text-sm text-muted-foreground font-mono">{currentXP.toLocaleString()} / {maxXP.toLocaleString()} XP</p>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Next Unlock at Rank {currentRank + 1}:</span> Enhanced profile customization
        </div>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={routes.member.rewards}>View Rank Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Quick stats section
interface QuickStatsProps {
  activeSurrogacies: number;
  openNeeds: number;
  activeOffers: number;
  pendingProposals: number;
}

function QuickStats({ activeSurrogacies, openNeeds, activeOffers, pendingProposals }: QuickStatsProps) {
  const stats = [
    { label: 'Active Surrogacies', value: activeSurrogacies },
    { label: 'Open Needs', value: openNeeds },
    { label: 'Active Offers', value: activeOffers },
    { label: 'Pending Proposals', value: pendingProposals },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <span className="font-semibold">{stat.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Getting started section
interface GettingStartedProps {
  hasNeeds: boolean;
  hasOffers: boolean;
}

function GettingStarted({ hasNeeds, hasOffers }: GettingStartedProps) {
  const steps = [
    { completed: hasNeeds, label: 'Create your first Need' },
    { completed: hasOffers, label: 'Create your first Offer' },
  ];

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle className="text-lg">Getting Started</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground mb-3">
          Complete these steps to enhance your experience:
        </p>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                step.completed ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
              )}>
                {step.completed ? "✓" : index + 1}
              </div>
              <span className={cn(step.completed ? "line-through text-muted-foreground" : "")}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main home page using decomposed components
export default function MemberHomePage() {
  // In a real implementation, these would come from hooks
  const [hasNeeds, setHasNeeds] = useState(true);
  const [hasOffers, setHasOffers] = useState(true);
  const [currentXP, setCurrentXP] = useState(4250);
  const [currentRank, setCurrentRank] = useState(7);
  
  // Load data from fixtures in demo mode
  const mockNeeds = getDemoData<Need[]>('needs', []);
  const mockOffers = getDemoData<Offer[]>('offers', []);
  const mockSurrogacies = getDemoData<Surrogacy[]>('surrogacies', []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <HomeHeader />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActiveSurrogacies surrogacies={mockSurrogacies} />
          <YourNeeds needs={mockNeeds} hasNeeds={hasNeeds} />
          <DiscoverOpportunities offers={mockOffers} hasOffers={hasOffers} />
        </div>
        
        <div className="space-y-6">
          <ProgressSection 
            currentXP={currentXP} 
            currentRank={currentRank} 
            maxXP={5000} 
          />
          <QuickStats 
            activeSurrogacies={mockSurrogacies.length}
            openNeeds={mockNeeds.length}
            activeOffers={mockOffers.length}
            pendingProposals={2}
          />
          {(!hasNeeds || !hasOffers) && (
            <GettingStarted 
              hasNeeds={hasNeeds}
              hasOffers={hasOffers}
            />
          )}
        </div>
      </div>
    </div>
  );
}