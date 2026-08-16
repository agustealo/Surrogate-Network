
import { PageWrapper } from '@/components/layout/PageWrapper';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquareText, Users, Search, Gift, Target, Handshake, ChevronDown, Heart, Briefcase, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import type { ChatSession, Offering, SurrogateCategory } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Conversations - Surrogate Network',
  description: 'Connect and communicate with your matches.',
};

const dummyChats: ChatSession[] = [
  { 
    id: 'chat1', 
    userId: '1', 
    userName: 'Elara Vance', 
    lastMessage: 'That cafe exploration idea sounds lovely! When are you free?', 
    unreadCount: 1, 
    avatarUrl: 'https://placehold.co/100x100.png?text=EV', 
    timestamp: '11:45 AM', 
    interactionFocus: 'seeking',
    offerings: [
      { id: 'o1', title: 'Empathetic Listener', category: 'personal' },
      { id: 'o2', title: 'Warm Cuddle Buddy', category: 'personal' },
    ] 
  },
  { 
    id: 'chat2', 
    userId: '2', 
    userName: 'Marcus Thorne', 
    lastMessage: 'I found a new recipe I\'d love to try cooking for someone. Interested in being my taste-tester?', 
    unreadCount: 0, 
    avatarUrl: 'https://placehold.co/100x100.png?text=MT', 
    timestamp: 'Yesterday', 
    interactionFocus: 'offering',
    offerings: [
      { id: 'o3', title: 'Engaging Book/Film Talks', category: 'casual' },
      { id: 'o4', title: 'Home-Cooked Meals with Love', category: 'personal' },
    ]
  },
  { 
    id: 'chat3', 
    userId: '3', 
    userName: 'Lena Petrova', 
    lastMessage: 'Thanks for the gardening tips! My balcony already looks happier. Would love to hear more about your hiking adventures sometime.', 
    unreadCount: 3, 
    avatarUrl: 'https://placehold.co/100x100.png?text=LP', 
    timestamp: 'Mon', 
    interactionFocus: 'mutual',
    offerings: [
      { id: 'o5', title: 'Truly Patient & Empathetic Listener', category: 'personal' },
      { id: 'o6', title: 'Craft Workshop Facilitator', category: 'casual' },
    ]
  },
  { 
    id: 'chat4', 
    userId: 'vivian', 
    userName: 'Vivian C.', 
    lastMessage: 'That sounds like exactly the kind of stimulating chat I was hoping for!', 
    unreadCount: 0, 
    avatarUrl: 'https://placehold.co/100x100.png?text=VC', 
    timestamp: 'Tue', 
    interactionFocus: 'seeking',
    offerings: [
      { id: 'o9', title: 'Engaging Conversationalist (Phone)', category: 'personal' },
      { id: 'o10', title: 'A Ray of Sunshine (Voice Only)', category: 'personal' },
    ]
  },
];

const InteractionFocusIcon = ({ focus }: { focus?: ChatSession['interactionFocus'] }) => {
  if (!focus) return null;
  let IconComponent = Target;
  let title = "Focused on Seeking";
  let colorClass = "text-blue-600";

  switch (focus) {
    case 'offering':
      IconComponent = Gift;
      title = "Focused on Offering";
      colorClass = "text-green-600";
      break;
    case 'seeking':
      IconComponent = Target;
      title = "Focused on Seeking";
      colorClass = "text-blue-600";
      break;
    case 'mutual':
      IconComponent = Handshake;
      title = "Mutual Exchange Focus";
      colorClass = "text-purple-600";
      break;
  }
  return <IconComponent className={cn("h-3.5 w-3.5", colorClass)} title={title} />;
};

const CategoryDisplay = ({ category }: { category: SurrogateCategory }) => {
  let icon = <Package className="h-3.5 w-3.5" />;
  let text = "Other";
  let colors = "bg-slate-100 text-slate-700 border-slate-300";

  switch (category) {
    case 'personal':
      icon = <Heart className="h-3.5 w-3.5" />;
      text = "Personal";
      colors = "bg-pink-100 text-pink-700 border-pink-200";
      break;
    case 'utilitarian_business':
      icon = <Briefcase className="h-3.5 w-3.5" />;
      text = "Business";
      colors = "bg-blue-100 text-blue-700 border-blue-200";
      break;
    case 'casual':
      icon = <Users className="h-3.5 w-3.5" />;
      text = "Casual";
      colors = "bg-green-100 text-green-700 border-green-200";
      break;
  }
  return (
    <Badge variant="outline" className={cn("text-xs font-normal capitalize py-1 px-2.5", colors)}>
      {icon}
      <span className="ml-1.5">{text}</span>
    </Badge>
  );
};


export default function ChatPage() {
  return (
    <PageWrapper title="Conversations" className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <MessageSquareText className="h-6 w-6" />
              Messages
            </CardTitle>
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" /> New Group
            </Button>
          </div>
          <div className="mt-4 relative">
            <Input placeholder="Search messages or users..." className="pr-10" />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {dummyChats.length > 0 ? (
            <ul className="divide-y divide-border">
              {dummyChats.map((chat) => (
                <li key={chat.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <Link href={`/profile/${chat.userId}`} passHref>
                      <Avatar className="h-12 w-12 cursor-pointer">
                        <AvatarImage src={chat.avatarUrl} alt={chat.userName} data-ai-hint="person portrait" />
                        <AvatarFallback>{chat.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                         <Link href={`/profile/${chat.userId}`} passHref>
                          <h3 className="font-semibold truncate text-foreground/90 hover:underline cursor-pointer">{chat.userName}</h3>
                        </Link>
                        <div className="flex items-center gap-1.5">
                          <InteractionFocusIcon focus={chat.interactionFocus} />
                          <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{chat.lastMessage}</p>
                      {chat.unreadCount > 0 && (
                        <div className="mt-1">
                          <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {chat.unreadCount} New
                          </span>
                        </div>
                      )}

                      {chat.offerings && chat.offerings.length > 0 && (
                        <Accordion type="single" collapsible className="w-full mt-2.5 -mb-2">
                          <AccordionItem value="offerings" className="border-b-0">
                            <AccordionTrigger className="text-xs text-muted-foreground hover:text-green-700 py-1.5 px-2 rounded hover:bg-green-500/10 transition-colors [&[data-state=open]>svg]:text-green-700">
                              View {chat.userName.split(' ')[0]}'s Offerings
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-1 pl-2 pr-1">
                              <ul className="space-y-1.5">
                                {chat.offerings.map(offering => (
                                  <li key={offering.id} className="flex items-center justify-between text-xs">
                                    <span className="text-foreground/80">{offering.title}</span>
                                    <CategoryDisplay category={offering.category} />
                                  </li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center">
              <MessageSquareText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No conversations yet.</p>
              <p className="text-sm text-muted-foreground">Start connecting with users to see messages here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
