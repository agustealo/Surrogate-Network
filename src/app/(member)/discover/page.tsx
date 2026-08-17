// Discover page components
// Decomposed discover page for maintainability

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Filter, Heart, Handshake, Star, MessageSquare, MapPin, Clock, Shield, Sparkles, X,
  Users, ChevronDown, SlidersHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FeedbackSummary } from '@/components/shared';
import { EmptyState } from '@/components/shared';
import { getDemoData } from '@/dev/fixtures';
import { formatRating, formatRelativeTime } from '@/lib/formatters';
import { routes } from '@/lib/routes';

type Category = 'personal' | 'casual' | 'utilitarian_business';

type Need = {
  id: string;
  title: string;
  description: string;
  category: Category;
  tags: string[];
  location?: string;
  timing?: string;
  boundaries: string[];
  urgency?: 'low' | 'medium' | 'high';
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
};

type Offer = {
  id: string;
  title: string;
  description: string;
  category: Category;
  compatibility: number;
  location?: string;
  timing?: string;
  boundaries: string[];
  userId: string;
  userName: string;
  userAvatar?: string;
  rating?: number;
  reviewCount?: number;
};

// Discover header with search and filters
interface DiscoverHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
}

function DiscoverHeader({ searchQuery, onSearchChange, onClearSearch }: DiscoverHeaderProps) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search needs, offers, or people..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={onClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-4">
          <FilterDialog />
          <Badge variant="outline" className="cursor-pointer">
            Personal <X className="h-3 w-3 ml-1" />
          </Badge>
          <Badge variant="outline" className="cursor-pointer">
            Remote <X className="h-3 w-3 ml-1" />
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// Filter dialog
function FilterDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filter Results</DialogTitle>
          <DialogDescription>
            Customize what you see in Discover
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="needs">Needs only</SelectItem>
                <SelectItem value="offers">Offers only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Location</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Any location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any location</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="either">Either</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Compatibility</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Any compatibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any compatibility</SelectItem>
                <SelectItem value="high">High (80%+)</SelectItem>
                <SelectItem value="very-high">Very high (90%+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Intent selector
function IntentSelector() {
  const intentOptions = [
    { icon: Heart, label: 'Something I Need', color: 'text-pink-500' },
    { icon: Handshake, label: 'Something I Can Offer', color: 'text-purple-500' },
    { icon: Sparkles, label: 'Available Now', color: 'text-green-500' },
    { icon: MapPin, label: 'Nearby', color: 'text-blue-500' },
    { icon: MessageSquare, label: 'Remote', color: 'text-teal-500' },
    { icon: Users, label: 'Pods', color: 'text-gray-400', disabled: true },
  ];

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-purple-10 border-primary/20">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold mb-4">What are you looking for?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {intentOptions.map((option) => (
            <Button 
              key={option.label}
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              disabled={option.disabled}
            >
              {React.createElement(option.icon, { className: `h-6 w-6 ${option.color}` })}
              <span className="font-medium">{option.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Need card component
function NeedCard({ need }: { need: Need }) {
  return (
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-pink-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-normal bg-pink-100 text-pink-700 border-pink-200">
                NEED
              </Badge>
              {need.urgency === 'high' && (
                <Badge variant="destructive" className="text-xs">Urgent</Badge>
              )}
            </div>
            <CardTitle className="text-lg text-pink-600">{need.title}</CardTitle>
          </div>
        </div>
        <CardDescription>
          <Link href={`${routes.memberDynamic.profile(need.userId)}`} className="hover:underline font-medium">
            {need.userName}
          </Link>
          {need.location && (
            <span className="ml-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {need.location}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{need.description}</p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {need.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {need.timing && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {need.timing}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {need.boundaries.slice(0, 3).map(boundary => (
            <Badge key={boundary} variant="outline" className="text-xs bg-muted/50">
              <Shield className="h-2.5 w-2.5 mr-1" />
              {boundary}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white" asChild>
          <Link href={`${routes.memberDynamic.need(need.id)}`}>
            <Heart className="mr-2 h-4 w-4" />
            Offer to Help
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Offer card component
function OfferCard({ offer }: { offer: Offer }) {
  return (
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="outline" className="text-xs font-normal bg-purple-100 text-purple-700 border-purple-200">
              OFFER
            </Badge>
            <CardTitle className="text-lg text-purple-600 mt-1">{offer.title}</CardTitle>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-lg">{offer.compatibility}%</span>
            </div>
            <p className="text-xs text-muted-foreground">compatible</p>
          </div>
        </div>
        <CardDescription>
          <Link href={`${routes.memberDynamic.profile(offer.userId)}`} className="hover:underline font-medium">
            {offer.userName}
          </Link>
          {offer.location && (
            <span className="ml-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {offer.location}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{offer.description}</p>

        {offer.rating && (
          <div className="flex items-center gap-2 mb-3">
            <FeedbackSummary
              rating={offer.rating}
              reviewCount={offer.reviewCount}
              compact
            />
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {offer.timing && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {offer.timing}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {offer.boundaries.slice(0, 3).map(boundary => (
            <Badge key={boundary} variant="outline" className="text-xs bg-muted/50">
              <Shield className="h-2.5 w-2.5 mr-1" />
              {boundary}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" asChild>
          <Link href={`${routes.memberDynamic.offer(offer.id)}`}>
            <Sparkles className="mr-2 h-4 w-4" />
            Request This Offer
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Intent tab content
function IntentTabContent() {
  return <IntentSelector />;
}

// Results tabs
interface ResultsTabProps {
  needs: Need[];
  offers: Offer[];
}

function NeedsTabContent({ needs }: ResultsTabProps) {
  if (needs.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No needs found"
        description="There are no needs that match your current criteria"
        primaryAction={{
          label: "Clear filters",
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {needs.map(need => (
        <NeedCard key={need.id} need={need} />
      ))}
    </div>
  );
}

function OffersTabContent({ offers }: ResultsTabProps) {
  if (offers.length === 0) {
    return (
      <EmptyState
        icon={Handshake}
        title="No offers found"
        description="There are no offers that match your current criteria"
        primaryAction={{
          label: "Clear filters",
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {offers.map(offer => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  );
}

function BrowseTabContent({ needs, offers }: ResultsTabProps) {
  const allItems = [...needs, ...offers];
  
  if (allItems.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No results found"
        description="Try adjusting your filters or search terms"
        primaryAction={{
          label: "Clear filters",
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {allItems.map(item => 
        'compatibility' in item ? (
          <OfferCard key={item.id} offer={item as Offer} />
        ) : (
          <NeedCard key={item.id} need={item as Need} />
        )
      )}
    </div>
  );
}

// Main discover page
export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('intent');

  // Load demo data
  const mockNeeds = getDemoData<Need[]>('needs', []);
  const mockOffers = getDemoData<Offer[]>('offers', []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Discover</h1>
        <p className="text-muted-foreground">
          Find compatible connections based on needs and offers
        </p>
      </div>

      <DiscoverHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="intent">What are you looking for?</TabsTrigger>
          <TabsTrigger value="needs">Needs I Can Fulfill</TabsTrigger>
          <TabsTrigger value="offers">Offers for My Needs</TabsTrigger>
          <TabsTrigger value="browse">Browse All</TabsTrigger>
        </TabsList>

        <TabsContent value="intent">
          <IntentTabContent />
        </TabsContent>

        <TabsContent value="needs">
          <NeedsTabContent needs={mockNeeds} offers={[]} />
        </TabsContent>

        <TabsContent value="offers">
          <OffersTabContent needs={[]} offers={mockOffers} />
        </TabsContent>

        <TabsContent value="browse">
          <BrowseTabContent needs={mockNeeds} offers={mockOffers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}