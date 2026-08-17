'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Heart, 
  Handshake, 
  Star, 
  MessageSquare, 
  MapPin, 
  Clock,
  Shield,
  Sparkles,
  ChevronDown,
  SlidersHorizontal,
  X,
  Users
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

const mockNeeds: Need[] = [
  {
    id: 'need-1',
    title: 'Late Night Conversation',
    description: 'Looking for someone to share deep conversations during quiet hours when everyone else is asleep',
    category: 'personal',
    tags: ['Conversation', 'Deep Talk', 'Night Owl'],
    location: 'Remote',
    timing: 'Tue-Thu · 8 PM-11 PM',
    boundaries: ['Platonic', 'Virtual', 'Recurring'],
    urgency: 'medium',
    userId: 'user-1',
    userName: 'Jordan Smith',
    userAvatar: 'https://placehold.co/100x100.png?text=JS',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'need-2',
    title: 'Cafe Exploration Partner',
    description: 'Want to discover local coffee shops together and have meaningful conversations',
    category: 'casual',
    tags: ['Coffee', 'Exploration', 'Social'],
    location: 'Local',
    timing: 'Weekends',
    boundaries: ['Platonic', 'Physical', 'One-time'],
    urgency: 'low',
    userId: 'user-2',
    userName: 'Alex Rivera',
    userAvatar: 'https://placehold.co/100x100.png?text=AR',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

const mockOffers: Offer[] = [
  {
    id: 'offer-1',
    title: 'Deep Conversation Partner',
    description: 'I offer a listening ear and engaging discussions about philosophy, life, and ideas',
    category: 'personal',
    compatibility: 94,
    location: 'Remote or nearby',
    timing: 'Flexible',
    boundaries: ['Platonic', 'Virtual', 'Recurring'],
    userId: 'user-3',
    userName: 'Jordan Smith',
    userAvatar: 'https://placehold.co/100x100.png?text=JS',
    rating: 4.9,
    reviewCount: 37,
  },
  {
    id: 'offer-2',
    title: 'Mindfulness Guide',
    description: 'Guided meditation sessions and mindfulness practice for beginners',
    category: 'personal',
    compatibility: 87,
    location: 'Remote',
    timing: 'Mon-Fri · 6 AM-8 AM',
    boundaries: ['Platonic', 'Virtual', 'Recurring'],
    userId: 'user-4',
    userName: 'Sam Taylor',
    userAvatar: 'https://placehold.co/100x100.png?text=ST',
    rating: 4.7,
    reviewCount: 22,
  },
];

const getCategoryIcon = (category: Category) => {
  switch (category) {
    case 'personal': return <Heart className="h-3 w-3" />;
    case 'casual': return <Handshake className="h-3 w-3" />;
    case 'utilitarian_business': return <Sparkles className="h-3 w-3" />;
  }
};

const getCategoryColors = (category: Category) => {
  switch (category) {
    case 'personal': return 'bg-pink-100 text-pink-700 border-pink-200';
    case 'casual': return 'bg-green-100 text-green-700 border-green-200';
    case 'utilitarian_business': return 'bg-blue-100 text-blue-700 border-blue-200';
  }
};

const NeedCard = ({ need }: { need: Need }) => (
  <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-pink-500">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={cn("text-xs font-normal", getCategoryColors(need.category))}>
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
        <Link href={`/profile/${need.userId}`} className="hover:underline font-medium">
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
        <Link href={`/needs/${need.id}`}>
          <Heart className="mr-2 h-4 w-4" />
          Offer to Help
        </Link>
      </Button>
    </CardFooter>
  </Card>
);

const OfferCard = ({ offer }: { offer: Offer }) => (
  <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div>
          <Badge variant="outline" className={cn("text-xs font-normal", getCategoryColors(offer.category))}>
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
        <Link href={`/profile/${offer.userId}`} className="hover:underline font-medium">
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
          <div className="flex">
            {[...Array(Math.floor(offer.rating))].map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            ))}
            {offer.rating % 1 !== 0 && (
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500/50" />
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {offer.rating} ({offer.reviewCount} reviews)
          </span>
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
        <Link href={`/offers/${offer.id}`}>
          <Sparkles className="mr-2 h-4 w-4" />
          Request This Offer
        </Link>
      </Button>
    </CardFooter>
  </Card>
);

const FilterDialog = () => (
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

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('intent');

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Discover</h1>
        <p className="text-muted-foreground">
          Find compatible connections based on needs and offers
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search needs, offers, or people..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery('')}
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="intent">What are you looking for?</TabsTrigger>
          <TabsTrigger value="needs">Needs I Can Fulfill</TabsTrigger>
          <TabsTrigger value="offers">Offers for My Needs</TabsTrigger>
          <TabsTrigger value="browse">Browse All</TabsTrigger>
        </TabsList>

        <TabsContent value="intent" className="space-y-6">
          <Card className="bg-gradient-to-r from-primary/10 to-purple-10 border-primary/20">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">What are you looking for?</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Heart className="h-6 w-6 text-pink-500" />
                  <span className="font-medium">Something I Need</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Handshake className="h-6 w-6 text-purple-500" />
                  <span className="font-medium">Something I Can Offer</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Sparkles className="h-6 w-6 text-green-500" />
                  <span className="font-medium">Available Now</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <MapPin className="h-6 w-6 text-blue-500" />
                  <span className="font-medium">Nearby</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <MessageSquare className="h-6 w-6 text-teal-500" />
                  <span className="font-medium">Remote</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" disabled>
                  <Users className="h-6 w-6 text-gray-400" />
                  <span className="font-medium text-muted-foreground">Pods (Coming Soon)</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="needs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockNeeds.map(need => (
              <NeedCard key={need.id} need={need} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="offers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockOffers.map(offer => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="browse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...mockNeeds, ...mockOffers].map(item => 
              'compatibility' in item ? (
                <OfferCard key={item.id} offer={item} />
              ) : (
                <NeedCard key={item.id} need={item} />
              )
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}