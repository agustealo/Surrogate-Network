
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TagBadge } from '@/components/common/TagBadge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Briefcase, Target, UserCircle, Link as LinkIcon, Video, ShieldCheck, BarChart3, Award, MessageCircle, UserPlus, Heart, Coffee, BookOpen, Star, Palette as PaletteIconLucide, Sparkles as SparklesIconLucide, Info, Leaf as LeafIconLucide, Loader2, Brain, Building, Package, Users, TrendingUp, Activity, Send, Gift, Coins } from 'lucide-react';
import type { Profile, Offering, Request as ProfileRequest, ProfileBadge, SurrogateCategory, StrengthMatrixPoint, ReviewSummaryPoint } from '@/lib/types';
import type { Profile as DomainProfile } from '@/domain/types';

// Type compatibility adapter
type ProfileType = Profile | DomainProfile;
import { cn } from '@/lib/utils';
import { fetchProfileById } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from "recharts";


const dummyProfiles: ProfileType[] = [
  {
    id: '1',
    name: 'Elara Vance',
    avatarUrl: 'https://placehold.co/100x100.png?text=EV',
    bio: 'A lover of quiet mornings and deep conversations. I offer a comforting presence, a shoulder to lean on, and enjoy sharing peaceful moments. I truly believe in the power of gentle touch and empathetic listening. Seeking a cafe exploration partner or a mindfulness buddy. Also, a warm cuddle buddy for cozy evenings.',
    offerings: [
      { id: 'o1', title: 'Empathetic Listener', category: 'personal', description: 'Offering a calm and understanding space for you to be yourself, judgment-free. I can listen for hours and provide thoughtful feedback if desired.', averageRating: 4.8, ratingCount: 25, tokenReward: 3 },
      { id: 'o2', title: 'Warm Cuddle Buddy', category: 'personal', description: 'Providing comforting, non-sexual cuddles for relaxation and emotional support. Great for de-stressing after a long week.', averageRating: 4.9, ratingCount: 18, tokenReward: 5 },
    ],
    requests: [
      { id: 'r1', title: 'Cafe Exploration Partner', category: 'casual', description: 'Seeking someone to discover charming local cafes with for quiet chats and good coffee. Let\'s find the best latte in town!', tags: ['Companionship', 'Coffee', 'Relaxation', 'Social'], averageRating: 4.7, ratingCount: 10, tokenCost: 2 },
      { id: 'r2', title: 'Mindfulness Buddy', category: 'personal', description: 'Looking for a partner to practice mindful meditation or share peaceful silences. Accountability and shared growth.', tags: ['Wellness', 'Meditation', 'Growth', 'Spiritual'], averageRating: 4.3, ratingCount: 5, tokenCost: 2 },
      { id: 'r9', title: 'Someone to Cook For (with love)', category: 'personal', description: 'I enjoy cooking delicious and thoughtful meals for someone special, like a partner would, filled with care and affection. Tell me your favorite comfort food!', tags: ['Cooking', 'Care', 'Nurturing', 'Companionship'], averageRating: 4.9, ratingCount: 7, tokenCost: 4 },
    ],
    matchScore: 92,
    portfolioUrl: 'https://elara.example.com',
    videoIntroUrl: 'https://youtube.com/elara',
    badges: [{id: 'b1', name: 'Top Listener', iconUrl: 'Award', description: 'Recognized for deep empathy.'}],
    createdAt: new Date().toISOString(),
    strengthMatrix: [
      { attribute: 'Listening', proficiency: 90 },
      { attribute: 'Empathy', proficiency: 95 },
      { attribute: 'Patience', proficiency: 80 },
      { attribute: 'Cooking', proficiency: 70 },
      { attribute: 'Mindfulness', proficiency: 75 },
      { attribute: 'Punctuality', proficiency: 85 },
    ],
    reviewSummary: [
      { rating: '5 Stars', count: 20 },
      { rating: '4 Stars', count: 15 },
      { rating: '3 Stars', count: 3 },
      { rating: '2 Stars', count: 1 },
      { rating: '1 Star', count: 0 },
    ],
  },
  {
    id: '2',
    name: 'Marcus Thorne',
    avatarUrl: 'https://placehold.co/100x100.png?text=MT',
    bio: 'Film buff and home cook, always ready for an engaging discussion or a shared meal prepared with care. I offer stimulating conversations and a shared appreciation for arts, culture, and good food. Looking for an art exhibit partner or a thoughtful debate friend. I love to cook for people with genuine affection.',
    offerings: [
      { id: 'o3', title: 'Engaging Book/Film Talks', category: 'casual', description: 'Passionate discussions about literature, cinema, and storytelling. Let\'s dissect the latest Oscar nominations!', averageRating: 4.6, ratingCount: 30, tokenReward: 2 },
      { id: 'o4', title: 'Home-Cooked Meals with Love', category: 'personal', description: 'I enjoy cooking for others with care and attention, like a partner would. Happy to share a meal and good conversation. My specialty is Italian comfort food.', averageRating: 4.9, ratingCount: 15, tokenReward: 4 },
    ],
    requests: [
      { id: 'r3', title: 'Art Exhibit Partner', category: 'casual', description: 'Wants to explore local art scenes and share perspectives. Impressionism to contemporary, I enjoy it all.', tags: ['Arts', 'Culture', 'Exploration', 'Learning'], averageRating: 4.2, ratingCount: 8, tokenCost: 3 },
      { id: 'r4', title: 'Someone to Cook For (like family)', category: 'personal', description: 'I love to cook for people with care and affection. Seeking an appreciative diner who enjoys good company and is open to trying new dishes.', tags: ['Cooking', 'Care', 'Nurturing', 'Companionship', 'Foodie'], averageRating: 4.0, ratingCount: 3, tokenCost: 4 },
    ],
    matchScore: 78,
    badges: [{id: 'b2', name: 'Culinary Star', iconUrl: 'PaletteIconLucide', description: 'Known for delicious home cooking.'}],
    createdAt: new Date().toISOString(),
    strengthMatrix: [
      { attribute: 'Cooking', proficiency: 95 },
      { attribute: 'Storytelling', proficiency: 85 },
      { attribute: 'Debate', proficiency: 75 },
      { attribute: 'Art Analysis', proficiency: 80 },
      { attribute: 'Punctuality', proficiency: 70 },
      { attribute: 'Reliability', proficiency: 88 },
    ],
    reviewSummary: [
      { rating: '5 Stars', count: 25 },
      { rating: '4 Stars', count: 18 },
      { rating: '3 Stars', count: 2 },
    ],
  },
  {
    id: '3',
    name: 'Lena Petrova',
    avatarUrl: 'https://placehold.co/100x100.png?text=LP',
    bio: 'A patient listener and a supportive friend. I believe in the power of empathy and genuine connection. Offering a shoulder to lean on and heartfelt encouragement. I also love teaching simple crafts. Seeking a hiking companion or a gardening mentor. I am a truly good listener.',
    offerings: [
      { id: 'o5', title: 'Truly Patient & Empathetic Listener', category: 'personal', description: 'A safe space to share your thoughts and feelings without judgment. I will genuinely hear you, and I am great at remembering details.', averageRating: 5.0, ratingCount: 20, tokenReward: 3 },
      { id: 'o6', title: 'Craft Workshop Facilitator', category: 'casual', description: 'Can teach basic knitting, crochet, or simple jewelry making in a fun, relaxed environment. No experience necessary!', averageRating: 4.7, ratingCount: 12, tokenReward: 2 },
    ],
    requests: [
      { id: 'r5', title: 'Hiking Trail Explorer', category: 'casual', description: 'Seeking a companion for adventurous (or leisurely) hikes and nature appreciation. Bonus if you know local trails!', tags: ['Nature', 'Fitness', 'Adventure', 'Outdoors'], averageRating: 4.5, ratingCount: 7, tokenCost: 2 },
      { id: 'r6', title: 'Gardening Mentor/Friend', category: 'casual', description: 'Wants to share gardening experiences or learn new tips together. Also happy to find a cuddle buddy if we connect well.', tags: ['Hobbies', 'Outdoors', 'Learning', 'Cuddles', 'Plants'], averageRating: 4.1, ratingCount: 4, tokenCost: 2 },
      { id: 'r12', title: 'A Good Listener in Return', category: 'personal', description: 'Looking for someone who can also offer a listening ear when I need to share my thoughts and feelings. Reciprocity is key.', tags: ['Emotional Support', 'Reciprocity', 'Friendship', 'Connection'], averageRating: 4.6, ratingCount: 11, tokenCost: 3 },
    ],
    matchScore: 65,
    badges: [{id: 'b3', name: 'Nature Enthusiast', iconUrl: 'LeafIconLucide', description: 'Loves the great outdoors.'}],
    createdAt: new Date().toISOString(),
    strengthMatrix: [
      { attribute: 'Listening', proficiency: 98 },
      { attribute: 'Crafting', proficiency: 85 },
      { attribute: 'Gardening', proficiency: 70 },
      { attribute: 'Hiking', proficiency: 75 },
      { attribute: 'Patience', proficiency: 90 },
    ],
    reviewSummary: [
      { rating: '5 Stars', count: 30 },
      { rating: '4 Stars', count: 5 },
    ],
  },
  {
    id: 'vivian',
    name: 'Vivian C.',
    avatarUrl: 'https://placehold.co/100x100.png?text=VC',
    bio: "Happily partnered, but my wonderful husband and I have different conversational wavelengths. I'm seeking a vibrant phone companion for stimulating chats – someone who loves to dive deep into topics, can share a laugh, and isn't afraid of some witty, playful banter to brighten the day. Discretion and mutual respect are key.",
    offerings: [
      { id: 'o9', title: 'Engaging Conversationalist (Phone)', category: 'personal', description: 'Ready to explore any topic, from philosophy to pop culture, with humor and insight, primarily via phone/voice. I have a broad range of interests!', averageRating: 4.7, ratingCount: 12, tokenReward: 2 },
      { id: 'o10', title: 'A Ray of Sunshine (Voice Only)', category: 'personal', description: 'I bring positivity and lightheartedness to our calls. Let\'s make each other smile! Perfect for a mood boost.', averageRating: 4.9, ratingCount: 8, tokenReward: 1 },
    ],
    requests: [
      { id: 'r10', title: 'Stimulating Phone Companion', category: 'personal', description: 'Looking for regular phone calls with someone articulate and fun. Deep talks, silly jokes, and playful, flirty (but respectful!) exchanges welcome.', tags: ['Phone Companion', 'Deep Conversation', 'Playful Banter', 'Intellectual', 'Flirty Chat'], averageRating: 4.5, ratingCount: 5, tokenCost: 2 },
      { id: 'r11', title: 'Intellectual Spark (Voice)', category: 'personal', description: 'Seeking someone who enjoys verbal sparring and can challenge my perspectives in a fun way over the phone. Love a good debate!', tags: ['Intellectual', 'Discussion', 'Phone Chat', 'Witty'], averageRating: 4.3, ratingCount: 3, tokenCost: 3 },
    ],
    matchScore: 88,
    badges: [{id: 'b4', name: 'Master of Wit', iconUrl: 'MessageCircle', description: 'Sharp and engaging conversations.'}],
    createdAt: new Date().toISOString(),
    strengthMatrix: [
      { attribute: 'Conversation', proficiency: 95 },
      { attribute: 'Humor', proficiency: 85 },
      { attribute: 'Intellect', proficiency: 90 },
      { attribute: 'Discretion', proficiency: 98 },
    ],
    reviewSummary: [
      { rating: '5 Stars', count: 15 },
      { rating: '4 Stars', count: 5 },
    ],
  },
  {
    id: 'caleb',
    name: 'Caleb Greene',
    avatarUrl: 'https://placehold.co/100x100.png?text=CG',
    bio: 'Seeking a deep connection. I offer a listening ear and thoughtful conversation. I enjoy quiet evenings, shared meals, and intellectual discussions. Looking for someone who values vulnerability and emotional intimacy. Perhaps a cuddle buddy for platonic comfort.',
    offerings: [
      { id: 'o7', title: 'Deep Conversation Partner', category: 'personal', description: 'Engaging in meaningful discussions about life, philosophy, and everything in between. I enjoy exploring complex topics.', averageRating: 4.7, ratingCount: 10, tokenReward: 3 },
      { id: 'o8', title: 'Thoughtful Companion for Quiet Evenings', category: 'personal', description: 'Offering a calm and supportive presence for shared activities or quiet moments. Happy to just be present or share silence.', averageRating: 4.9, ratingCount: 7, tokenReward: 2 },
    ],
    requests: [
      { id: 'r7', title: 'Emotional Intimacy Seeker', category: 'personal', description: 'Looking for someone to share vulnerable conversations and build a deep, platonic bond. Mutual trust is important.', tags: ['Emotional Support', 'Connection', 'Intimacy', 'Trust'], averageRating: 4.5, ratingCount: 6, tokenCost: 4 },
      { id: 'r8', title: 'Platonic Cuddle Buddy', category: 'personal', description: 'Seeking respectful, non-sexual cuddles for comfort and relaxation. A safe space for warmth and connection.', tags: ['Comfort', 'Cuddles', 'Platonic', 'Warmth'], averageRating: 4.8, ratingCount: 9, tokenCost: 5 },
    ],
    matchScore: 85,
    badges: [{id: 'b5', name: 'Deep Thinker', iconUrl: 'Brain', description: 'Values profound conversations.'}],
    createdAt: new Date().toISOString(),
     strengthMatrix: [
      { attribute: 'Philosophy', proficiency: 80 },
      { attribute: 'Vulnerability', proficiency: 90 },
      { attribute: 'Listening', proficiency: 88 },
      { attribute: 'Comfort', proficiency: 85 },
    ],
    reviewSummary: [
      { rating: '5 Stars', count: 12 },
      { rating: '4 Stars', count: 8 },
    ],
  },
  {
    id: 'bizconnect',
    name: 'BizConnect Solutions',
    avatarUrl: 'https://placehold.co/100x100.png?text=BS',
    bio: 'Dynamic consultancy offering project management expertise, virtual assistant services, and strategic business planning. We help entrepreneurs and SMEs scale effectively. Looking for freelance talent and innovative projects.',
    offerings: [
      { id: 'o11', title: 'Project Management Pro', category: 'utilitarian_business', description: 'Full-cycle project management, from initiation to completion. Agile & Waterfall. Certified PMP.', averageRating: 4.9, ratingCount: 35, tokenReward: 10 },
      { id: 'o12', title: 'Executive Virtual Assistant', category: 'utilitarian_business', description: 'High-level administrative, technical, and creative assistance to executives. 10+ years experience.', averageRating: 4.8, ratingCount: 20, tokenReward: 8 },
    ],
    requests: [
      { id: 'r12', title: 'Freelance Web Developer (React)', category: 'utilitarian_business', description: 'Seeking skilled React developers for contract-based projects. Must have 3+ years experience.', tags: ['WebDev', 'React', 'Freelance', 'Tech'], averageRating: 4.2, ratingCount: 3, tokenCost: 15 },
      { id: 'r13', title: 'Marketing Strategy Collaboration', category: 'utilitarian_business', description: 'Looking to partner with marketing experts for joint ventures. Focus on B2B SaaS.', tags: ['Marketing', 'Strategy', 'Partnership', 'B2B'], averageRating: 4.0, ratingCount: 1, tokenCost: 20 },
    ],
    matchScore: 75,
    badges: [{id: 'b6', name: 'Top Project Manager', iconUrl: 'Briefcase', description: 'Excelled in numerous project deliveries.'}],
    createdAt: new Date().toISOString(),
    strengthMatrix: [
      { attribute: 'Project Mgmt', proficiency: 95 },
      { attribute: 'Strategy', proficiency: 90 },
      { attribute: 'Communication', proficiency: 85 },
      { attribute: 'Problem Solving', proficiency: 88 },
    ],
    reviewSummary: [
      { rating: '5 Stars', count: 40 },
      { rating: '4 Stars', count: 15 },
    ],
  }
];

const mockCurrentUserOfferings: Offering[] = [
    { id: 'my-offer-1', title: "My Awesome Offering A", category: 'personal', description: "Desc A" },
    { id: 'my-offer-2', title: "My Business Service B", category: 'utilitarian_business', description: "Desc B" },
    { id: 'my-offer-3', title: "My Casual Skill C", category: 'casual', description: "Desc C" }
];


const RatingStars = ({ rating, count, starClassName = "h-4 w-4" }: { rating?: number; count?: number; starClassName?: string }) => {
  if (typeof rating !== 'number') return <span className="text-xs text-muted-foreground">Not rated yet</span>;
  const fullStars = Math.floor(rating);
  const emptyStars = 5 - fullStars;

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className={cn(starClassName, "text-yellow-400 fill-yellow-400")} />
      ))}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className={cn(starClassName, "text-muted-foreground/50")} />
      ))}
      {typeof count === 'number' && <span className="text-xs text-muted-foreground ml-1.5">({count} ratings)</span>}
    </div>
  );
};

const getCategoryDisplay = (category?: SurrogateCategory) => {
  if (!category) return null;
  let icon = <Package className="h-3 w-3" />;
  let text = "Other";
  let colors = "bg-slate-200 text-slate-700 border-slate-300";

  switch (category) {
    case 'personal':
      icon = <Heart className="h-3 w-3" />;
      text = "Personal";
      colors = "bg-pink-100 text-pink-700 border-pink-300";
      break;
    case 'utilitarian_business':
      icon = <Briefcase className="h-3 w-3" />;
      text = "Utilitarian/Business";
      colors = "bg-blue-100 text-blue-700 border-blue-300";
      break;
    case 'casual':
      icon = <Users className="h-3 w-3" />;
      text = "Casual";
      colors = "bg-green-100 text-green-700 border-green-300";
      break;
  }
  return (
    <Badge variant="outline" className={cn("text-xs font-medium capitalize py-0.5 px-2", colors)}>
      {icon}
      <span className="ml-1">{text}</span>
    </Badge>
  );
};

const strengthChartConfig = {
  proficiency: {
    label: "Proficiency",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const reviewChartConfig = {
  count: {
    label: "Review Count",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;


export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProfileRequest | null>(null);
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null);

  // Type guard to check if profile is legacy Profile type
  const isLegacyProfile = (p: ProfileType): p is Profile => {
    return 'offerings' in p && 'requests' in p;
  };


  useEffect(() => {
    if (userId) {
      const loadProfile = async () => {
        setIsLoading(true);
        try {
          const data = await fetchProfileById(userId);
          if (data) {
            setProfile(data as ProfileType);
            document.title = `${data.name} - Profile | Surrogate Network`;
          } else {
            const dummyProfile = dummyProfiles.find(p => p.id === userId);
            if (dummyProfile) {
                setProfile(dummyProfile as ProfileType);
                document.title = `${dummyProfile.name} - Profile (Demo) | Surrogate Network`;
                 toast({
                    title: "Using Demo Data",
                    description: `Could not find live profile for ID ${userId}. Displaying sample data instead. Original error: Profile not found.`,
                    variant: "default",
                });
            } else {
                setProfile(null);
                document.title = `Profile Not Found | Surrogate Network`;
                toast({
                    title: "Profile Not Found",
                    description: `Sorry, we couldn't find a profile for ID: ${userId}.`,
                    variant: "destructive",
                });
            }
          }
        } catch (error: any) {
            console.error(`Error in UserProfilePage for ID '${userId}':`, error);
            const dummyProfile = dummyProfiles.find(p => p.id === userId);
            if (dummyProfile) {
                setProfile(dummyProfile as ProfileType);
                document.title = `${dummyProfile.name} - Profile (Demo Fallback) | Surrogate Network`;
                let description = `Displaying sample data for ${dummyProfile.name}. `;
                if (error.message && error.message.toLowerCase().includes('client is offline')) {
                    description += 'The application appears to be offline and cannot connect to the live database.';
                } else {
                    description += `Could not retrieve live data. Original error: ${error.message || String(error)}`;
                }
                toast({
                    title: "Offline Mode / Data Error",
                    description: description,
                    variant: "default",
                });
            } else {
                setProfile(null);
                 document.title = `Profile Not Found | Surrogate Network`;
                 toast({
                    title: "Profile Retrieval Failed",
                    description: `Failed to load profile for ID '${userId}'. Original error: ${error.message || String(error)}`,
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
      };
      loadProfile();
    }
  }, [userId, toast]);
  
  const handlePitchOfferClick = (request: ProfileRequest) => {
    setSelectedRequest(request);
    setSelectedOffering(null); // Reset selection
    setIsProposalDialogOpen(true);
  };

  const handleSendProposal = () => {
    if (!selectedOffering || !selectedRequest) {
      toast({ title: "Please select an offering", variant: "destructive" });
      return;
    }
    console.log(`PROPOSAL: User offers '${selectedOffering.title}' for the request '${selectedRequest.title}'. Token cost: ${selectedRequest.tokenCost}`);
    toast({
      title: "Proposal Sent (Mock)!",
      description: `Your offer of "${selectedOffering.title}" has been sent for "${selectedRequest.title}".`,
    });
    setIsProposalDialogOpen(false);
  };


  if (isLoading) {
    return (
      <PageWrapper title="Loading Profile...">
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </PageWrapper>
    );
  }

  if (!profile) {
    return (
        <PageWrapper title="Profile Not Found">
            <Card className="text-center py-12">
                <CardHeader>
                    <UserCircle className="mx-auto h-24 w-24 text-muted-foreground" />
                    <CardTitle className="mt-6 text-2xl">Profile Unavailable</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                    The profile you are looking for (ID: {userId}) does not exist or could not be loaded.
                    </p>
                     <p className="text-xs text-muted-foreground mt-2">Please ensure the profile ID is correct and you have an active internet connection.</p>
                </CardContent>
                <CardFooter className="justify-center">
                    <Button asChild variant="outline">
                        <Link href="/matches">Explore Other Connections</Link>
                    </Button>
                </CardFooter>
            </Card>
        </PageWrapper>
    );
  }

  const renderBadgeIcon = (iconName?: string) => {
    if (!iconName) return <Award className="h-5 w-5 text-primary" />;
    switch(iconName.toLowerCase()) {
      case 'award': return <Award className="h-5 w-5 text-yellow-500" />;
      case 'shieldcheck': return <ShieldCheck className="h-5 w-5 text-green-500" />;
      case 'sparklesiconlucide': case 'sparkles': return <SparklesIconLucide className="h-5 w-5 text-pink-500" />;
      case 'paletteiconlucide': case 'palette': return <PaletteIconLucide className="h-5 w-5 text-purple-500" />;
      case 'messagecircle': return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'leaficonlucide': case 'leaf': return <LeafIconLucide className="h-5 w-5 text-green-600" />;
      case 'bookopen': return <BookOpen className="h-5 w-5 text-indigo-500" />;
      case 'brain': return <Brain className="h-5 w-5 text-teal-500" />;
      case 'briefcase': return <Briefcase className="h-5 w-5 text-amber-700" />;
      default: return <Award className="h-5 w-5 text-primary" />;
    }
  }

  const renderDetailModal = (item: Offering | ProfileRequest, type: 'Offering' | 'Request') => (
    <DialogContent className="sm:max-w-lg bg-card">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          {type === 'Offering' ? <Heart className="text-primary h-6 w-6" /> : <Coffee className="text-accent h-6 w-6" />}
          {item.title}
        </DialogTitle>
        <div className="pt-1 flex justify-between items-center">
          {getCategoryDisplay(item.category)}
           {type === 'Offering' && typeof item.tokenReward === 'number' && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                <span>Reward:</span> <Coins className="h-4 w-4" /> <span>+{item.tokenReward}</span>
              </div>
            )}
            {type === 'Request' && typeof item.tokenCost === 'number' && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-accent">
                <span>Cost:</span> <Coins className="h-4 w-4" /> <span>{item.tokenCost}</span>
              </div>
            )}
        </div>
        <DialogDescription className="pt-3 text-left text-base text-muted-foreground leading-relaxed">
          {item.description}
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <div>
            <h4 className="font-semibold text-sm mb-1.5 text-foreground/80">Rating &amp; Reviews</h4>
            <RatingStars rating={item.averageRating} count={item.ratingCount} starClassName="h-5 w-5" />
            {(!item.averageRating && typeof item.ratingCount !== 'number') && <p className="text-xs text-muted-foreground mt-1">No ratings or reviews for this {type.toLowerCase()} yet.</p>}
        </div>
        {type === 'Request' && (item as ProfileRequest).tags && ((item as ProfileRequest).tags?.length ?? 0) > 0 && (
             <div>
                <h4 className="font-semibold text-sm mb-1.5 text-foreground/80">Relevant Tags:</h4>
                <div className="flex flex-wrap gap-2">
                    {(item as ProfileRequest).tags!.map(tag => (
                        <TagBadge key={tag} tag={tag} className="text-sm px-3 py-1 bg-accent text-accent-foreground border-transparent" />
                    ))}
                </div>
            </div>
        )}
      </div>
      <DialogFooter className="mt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline" size="lg">
            Close
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );

  return (
    <PageWrapper title={profile.name} className="max-w-5xl mx-auto">
      {/* Proposal Dialog */}
      <Dialog open={isProposalDialogOpen} onOpenChange={setIsProposalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Propose Your Offering</DialogTitle>
            <DialogDescription>
              Select one of your offerings to propose for <span className="font-semibold text-accent">{selectedRequest?.title}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <h4 className="font-medium">Your Available Offerings:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {mockCurrentUserOfferings.map(offering => (
                <div
                  key={offering.id}
                  onClick={() => setSelectedOffering(offering)}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-all",
                    selectedOffering?.id === offering.id 
                      ? "bg-primary/10 border-primary ring-2 ring-primary" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <p className="font-semibold">{offering.title}</p>
                  <p className="text-sm text-muted-foreground">{offering.description}</p>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
             {selectedRequest?.tokenCost && (
                <div className="text-sm text-muted-foreground flex items-center gap-1.5 mr-auto">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span>Sending this proposal will hold <span className="font-bold text-foreground">{selectedRequest.tokenCost}</span> tokens in escrow.</span>
                </div>
             )}
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <Button onClick={handleSendProposal} disabled={!selectedOffering}>
              Send Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-xl overflow-hidden rounded-lg">
            <div className="relative h-40 md:h-48 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/20">
               <Image
                src={profile.avatarUrl ? `https://placehold.co/600x300.png?text=${profile.name.substring(0,1)}` : "https://placehold.co/600x300.png"}
                alt={`${profile.name}'s abstract cover image`}
                data-ai-hint="abstract texture connection"
                layout="fill"
                objectFit="cover"
                className="opacity-60 group-hover:opacity-75 transition-opacity"
              />
            </div>
            <div className="flex justify-center -mt-16 relative z-10">
              <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-background bg-background shadow-lg">
                <AvatarImage src={profile.avatarUrl} alt={profile.name} data-ai-hint="person portrait authentic" />
                <AvatarFallback className="text-4xl">{profile.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <CardHeader className="text-center pt-4 pb-2">
              <CardTitle className="text-2xl md:text-3xl">{profile.name}</CardTitle>
              <CardDescription className="text-primary text-sm md:text-base mt-1">
                Exploring connections on Surrogate Network
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-3 px-4 pb-4">
                {(profile.portfolioUrl || profile.videoIntroUrl) && (
                    <div className="flex flex-col sm:flex-row justify-center gap-2">
                        {profile.portfolioUrl && (
                        <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                            <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="truncate">
                            <LinkIcon className="mr-2 h-4 w-4" /> My Story/Portfolio
                            </a>
                        </Button>
                        )}
                        {profile.videoIntroUrl && (
                        <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                            <a href={profile.videoIntroUrl} target="_blank" rel="noopener noreferrer" className="truncate">
                            <Video className="mr-2 h-4 w-4" /> Hear My Voice
                            </a>
                        </Button>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2 p-4 border-t bg-muted/20">
              <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <MessageCircle className="mr-2 h-4 w-4" /> Message {profile.name.split(' ')[0]}
              </Button>
            </CardFooter>
          </Card>

          {profile.badges && profile.badges.length > 0 && (
            <Card className="shadow-xl rounded-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><Award className="text-primary h-5 w-5"/> Qualities &amp; Recognition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.badges.map(badge => (
                  <div key={badge.id} className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors shadow-sm">
                    <div className="flex-shrink-0 mt-0.5">
                      {renderBadgeIcon(badge.iconUrl)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground/90">{badge.name}</h4>
                      {badge.description && <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-xl rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><UserCircle className="text-primary h-5 w-5"/>My Story (Bio)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm md:text-base">{profile.bio}</p>
            </CardContent>
          </Card>

          <Card className="shadow-xl rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><Heart className="text-primary h-5 w-5" /> Surrogate Offer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.offerings.length > 0 ? profile.offerings.map((offering: Offering) => (
                <Dialog key={offering.id}>
                  <DialogTrigger asChild>
                    <div className="p-4 border rounded-md shadow-sm bg-card hover:shadow-md hover:border-primary/70 transition-all cursor-pointer group block">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-primary text-md group-hover:underline">
                          {offering.title}
                        </h3>
                         {typeof offering.tokenReward === 'number' && (
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                                <span>+{offering.tokenReward}</span>
                                <Coins className="h-4 w-4" />
                            </div>
                        )}
                      </div>
                      <div className="mb-1.5">
                         {getCategoryDisplay(offering.category)}
                      </div>
                      <RatingStars rating={offering.averageRating} count={offering.ratingCount} starClassName="h-3.5 w-3.5" />
                      <p className="text-xs text-muted-foreground mt-2 truncate">{offering.description}</p>
                    </div>
                  </DialogTrigger>
                  {renderDetailModal(offering, 'Offering')}
                </Dialog>
              )) : <p className="text-sm text-muted-foreground italic p-4">Details about what I offer are being curated.</p>}
            </CardContent>
          </Card>

          <Card className="shadow-xl rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><Coffee className="text-accent h-5 w-5" /> Surrogacy needed for</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.requests.length > 0 ? profile.requests.map((request: ProfileRequest) => (
                 <div key={request.id} className="p-4 border rounded-md shadow-sm bg-card transition-all group block">
                    <div className="flex items-start justify-between mb-1">
                        <div>
                            <h3 className="font-semibold text-accent text-md">
                                {request.title}
                            </h3>
                            <div className="my-1.5">
                                {getCategoryDisplay(request.category)}
                            </div>
                            <RatingStars rating={request.averageRating} count={request.ratingCount} starClassName="h-3.5 w-3.5"/>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handlePitchOfferClick(request)}>
                            <Send className="mr-2 h-4 w-4" />
                            Pitch an Offer!
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 truncate">{request.description}</p>
                    {request.tags && request.tags.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {request.tags.slice(0, 4).map(tag => <TagBadge key={tag} tag={tag} className="text-xs px-2 py-1 bg-accent text-accent-foreground border-transparent" />)}
                        {request.tags.length > 4 && <TagBadge tag={`+${request.tags.length - 4} more`} variant="outline" className="text-xs px-1.5 py-0.5 bg-muted/50"/> }
                        </div>
                    )}
                </div>
              )) : <p className="text-sm text-muted-foreground italic p-4">Details about what I seek are being contemplated.</p>}
            </CardContent>
          </Card>

          <Card className="shadow-xl rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><Activity className="text-primary h-5 w-5" />Surrogate Matrix</CardTitle>
              <CardDescription>Self-assessed proficiency in various attributes relevant to connections on Surrogate Network.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {profile.strengthMatrix && profile.strengthMatrix.length > 0 ? (
                <ChartContainer config={strengthChartConfig} className="mx-auto aspect-square max-h-[300px]">
                  <RadarChart data={profile.strengthMatrix} margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                    <CartesianGrid  className="stroke-border/50" />
                    <PolarAngleAxis dataKey="attribute" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Radar name="Proficiency" dataKey="proficiency" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RadarChart>
                </ChartContainer>
              ) : (
                <div className="mt-4 h-40 bg-muted/30 rounded-md flex items-center justify-center text-muted-foreground/70 border border-dashed">
                  Strength matrix data is not available.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-xl rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><TrendingUp className="text-green-600 h-5 w-5" />Reputation Snapshot</CardTitle>
              <CardDescription>A summary of ratings received from past connections on Surrogate Network.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
               {profile.reviewSummary && profile.reviewSummary.length > 0 ? (
                <ChartContainer config={reviewChartConfig} className="mx-auto aspect-[16/9] max-h-[300px]">
                  <BarChart data={profile.reviewSummary} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid vertical={false} className="stroke-border/50" />
                    <XAxis dataKey="rating" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}/>
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={4} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="mt-4 h-48 bg-muted/30 rounded-md flex items-center justify-center text-muted-foreground/70 border border-dashed">
                  Reputation data is not available.
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </PageWrapper>
  );
}
