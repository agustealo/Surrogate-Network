
'use client';

import { useEffect, useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TagBadge } from '@/components/common/TagBadge';
import { UsersRound, Sparkle, Loader2, Heart, Briefcase, Users, FileText, HandHelping, Filter, Coins } from 'lucide-react';
import Link from 'next/link';
import type { Profile, Offering, Request as ProfileRequest, SurrogateCategory, Boundary } from '@/lib/types';
import { cn } from '@/lib/utils';
import { fetchProfiles, addProfile } from '@/services/profileService'; // Assuming these will be replaced with need/offer specific services
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const profilesToSeed: Profile[] = [
  // This data structure will likely change to be needs/offers fetched directly
  // For now, we'll derive the board from profiles.
   {
    id: '1',
    name: 'Elara Vance',
    avatarUrl: 'https://placehold.co/100x100.png?text=EV',
    bio: 'A lover of quiet mornings and deep conversations.',
    offerings: [
      { id: 'o1', title: 'Empathetic Listener', description: 'Offering a calm space.', category: 'personal', boundaries: ['virtual', 'platonic', 'recurring'], tokenReward: 3 },
      { id: 'o2', title: 'Warm Cuddle Buddy', description: 'Non-sexual cuddles.', category: 'personal', boundaries: ['physical', 'platonic', 'one-off'], tokenReward: 5 },
    ],
    requests: [
      { id: 'r1', title: 'Cafe Exploration Partner', description: 'Discover local cafes.', category: 'casual', tags: ['Companionship', 'Coffee'], boundaries: ['physical', 'platonic', 'recurring'], tokenCost: 2 },
      { id: 'r2', title: 'Mindfulness Buddy', description: 'Practice meditation together.', category: 'personal', tags: ['Wellness', 'Meditation'], boundaries: ['virtual', 'platonic', 'recurring'], tokenCost: 2 },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '2',
    name: 'Marcus Thorne',
    avatarUrl: 'https://placehold.co/100x100.png?text=MT',
    bio: 'Film buff and home cook.',
    offerings: [
      { id: 'o3', title: 'Engaging Book/Film Talks', description: 'Passionate discussions.', category: 'casual', boundaries: ['virtual', 'platonic', 'recurring'], tokenReward: 2 },
      { id: 'o4', title: 'Home-Cooked Meals', description: 'I cook for you.', category: 'personal', boundaries: ['physical', 'platonic', 'one-off'], tokenReward: 4 },
    ],
    requests: [
      { id: 'r3', title: 'Art Exhibit Partner', description: 'Explore local art.', category: 'casual', tags: ['Arts', 'Culture'], boundaries: ['physical', 'platonic', 'recurring'], tokenCost: 3 },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];


const CategoryDisplay = ({ category, className }: { category: SurrogateCategory, className?: string }) => {
  let icon = <Heart className="h-3 w-3" />;
  let text = "Personal";
  let colors = "bg-pink-100 text-pink-700 border-pink-200";

  switch (category) {
    case 'utilitarian_business':
      icon = <Briefcase className="h-3 w-3" />;
      text = "Business";
      colors = "bg-blue-100 text-blue-700 border-blue-200";
      break;
    case 'casual':
      icon = <Users className="h-3 w-3" />;
      text = "Casual";
      colors = "bg-green-100 text-green-700 border-green-200";
      break;
  }
  return (
    <Badge variant="outline" className={cn("text-xs font-normal capitalize py-1 px-2", colors, className)}>
      {icon}
      <span className="ml-1.5">{text}</span>
    </Badge>
  );
};

const BoundaryDisplay = ({ boundaries }: { boundaries: Boundary[] }) => (
    <div className="flex flex-wrap gap-1.5 mt-2">
        {boundaries.map(b => (
            <Badge key={b} variant="outline" className="text-xs px-2 py-0.5 bg-muted/50 font-normal">{b}</Badge>
        ))}
    </div>
);


const NeedCard = ({ request, user }: { request: ProfileRequest; user: Profile }) => (
  <Card className="w-full shadow-md hover:shadow-lg transition-shadow border-l-4 border-pink-500">
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
            <CardTitle className="text-lg text-pink-600">{request.title}</CardTitle>
        </div>
        {typeof request.tokenCost === 'number' && (
           <div className="flex items-center gap-1.5 text-sm font-semibold text-pink-600">
            <Coins className="h-4 w-4" />
            <span>{request.tokenCost}</span>
          </div>
        )}
      </div>
      <CardDescription>
        Needed by <Link href={`/profile/${user.id}`} className="text-primary hover:underline font-semibold">{user.name}</Link>
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground mb-3 min-h-[40px]">{request.description}</p>
      <div className="flex flex-wrap gap-1">
        {request.tags?.map(tag => <TagBadge key={tag} tag={tag} />)}
      </div>
      <Separator className="my-3" />
      <BoundaryDisplay boundaries={request.boundaries || []} />
    </CardContent>
    <CardFooter>
      <Button asChild className="w-full bg-pink-600 text-white hover:bg-pink-600/90">
         <Link href={`/profile/${user.id}`}>
            <HandHelping className="mr-2 h-4 w-4" />
            Offer to Help
         </Link>
      </Button>
    </CardFooter>
  </Card>
);

const OfferCard = ({ offering, user }: { offering: Offering; user: Profile }) => (
  <Card className="w-full shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-600">
    <CardHeader>
       <div className="flex justify-between items-start">
        <div>
            <CardTitle className="text-lg text-purple-700">{offering.title}</CardTitle>
        </div>
        {typeof offering.tokenReward === 'number' && (
          <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
            <Coins className="h-4 w-4" />
            <span>+{offering.tokenReward}</span>
          </div>
        )}
      </div>
      <CardDescription>
        Offered by <Link href={`/profile/${user.id}`} className="text-primary hover:underline font-semibold">{user.name}</Link>
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground mb-3 min-h-[40px]">{offering.description}</p>
      <CategoryDisplay category={offering.category} />
      <Separator className="my-3" />
      <BoundaryDisplay boundaries={offering.boundaries || []} />
    </CardContent>
    <CardFooter>
       <Button asChild className="w-full bg-purple-600 text-white hover:bg-purple-600/90">
         <Link href={`/profile/${user.id}`}>
            <Sparkle className="mr-2 h-4 w-4" />
            Request This Offer
         </Link>
      </Button>
    </CardFooter>
  </Card>
);


export default function SurrogacyBoardPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    document.title = 'Surrogacy Board - Surrogate Network';

    async function loadData() {
      setIsLoading(true);
      try {
        const fetchedProfiles = await fetchProfiles();
        if (fetchedProfiles.length === 0) {
            setProfiles(profilesToSeed);
            toast({
                title: "Using Sample Data",
                description: "The live board is empty, so we're showing some examples.",
            });
        } else {
            setProfiles(fetchedProfiles);
        }
      } catch (err: any) {
        console.error(err);
        setError(`Failed to load data: ${err.message || 'Please try again later.'}`);
        setProfiles(profilesToSeed); // Fallback to dummy data on error
        toast({
          title: 'Error Loading Board',
          description: `Could not retrieve live data. Displaying sample board. ${err.message || ''}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [toast]);

  const allItems = profiles
    .flatMap(p => [
      ...p.requests.map(r => ({ type: 'need' as const, user: p, item: r, createdAt: p.createdAt })),
      ...p.offerings.map(o => ({ type: 'offer' as const, user: p, item: o, createdAt: p.createdAt }))
    ])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


  if (isLoading) {
    return (
      <PageWrapper title="Building the Board..." className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Welcome to the Surrogacy Board" className="max-w-7xl mx-auto">
      <Card className="mb-8 bg-muted/30">
          <CardHeader>
              <CardTitle>The Co-op Board</CardTitle>
              <CardDescription>
                  This is the heart of the Surrogate Network. Below is a combined feed of needs and offers from the community. Find a need you can fill or an offer that can help you.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter by Boundaries</Button>
          </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {allItems.length > 0 ? (
          allItems.map(({ type, user, item }) => (
            type === 'need' ? (
              <NeedCard key={item.id} user={user} request={item as ProfileRequest} />
            ) : (
              <OfferCard key={item.id} user={user} offering={item as Offering} />
            )
          ))
        ) : (
          <p className="text-muted-foreground text-center py-8 md:col-span-2">No needs or offers posted right now.</p>
        )}
      </div>

    </PageWrapper>
  );
}
