'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, Heart, Handshake, Clock, Filter, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

type InteractionContext = {
  type: 'need' | 'offer' | 'surrogacy';
  title: string;
  itemId?: string;
  surrogacyId?: string;
};

type MessageThread = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  interactionContext: InteractionContext;
  isOnline?: boolean;
};

const mockThreads: MessageThread[] = [
  {
    id: 'thread-1',
    userId: 'user-1',
    userName: 'Jordan Smith',
    userAvatar: 'https://placehold.co/100x100.png?text=JS',
    lastMessage: 'That cafe exploration idea sounds lovely! When are you free?',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unreadCount: 1,
    interactionContext: {
      type: 'need',
      title: 'Cafe Exploration Partner',
      itemId: 'need-1',
    },
    isOnline: true,
  },
  {
    id: 'thread-2',
    userId: 'user-2',
    userName: 'Alex Rivera',
    userAvatar: 'https://placehold.co/100x100.png?text=AR',
    lastMessage: 'I found a new recipe I\'d love to try cooking for someone. Interested?',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unreadCount: 0,
    interactionContext: {
      type: 'offer',
      title: 'Home-Cooked Meals',
      itemId: 'offer-1',
    },
  },
  {
    id: 'thread-3',
    userId: 'user-3',
    userName: 'Sam Taylor',
    userAvatar: 'https://placehold.co/100x100.png?text=ST',
    lastMessage: 'Thanks for the mindfulness session yesterday. Really helped!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unreadCount: 3,
    interactionContext: {
      type: 'surrogacy',
      title: 'Mindfulness Practice',
      surrogacyId: 'surrogacy-1',
    },
    isOnline: false,
  },
];

const ContextBadge = ({ context }: { context: InteractionContext }) => {
  const colors = {
    need: 'bg-pink-100 text-pink-700 border-pink-200',
    offer: 'bg-purple-100 text-purple-700 border-purple-200',
    surrogacy: 'bg-green-100 text-green-700 border-green-200',
  };

  const icons = {
    need: Heart,
    offer: Handshake,
    surrogacy: Clock,
  };

  const Icon = icons[context.type];

  return (
    <Badge variant="outline" className={cn("text-xs font-normal", colors[context.type])}>
      <Icon className="h-3 w-3 mr-1" />
      {context.type === 'surrogacy' ? 'Active Surrogacy' : context.type}
    </Badge>
  );
};

const ThreadItem = ({ thread }: { thread: MessageThread }) => (
  <Link href={`/messages/${thread.id}`}>
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={thread.userAvatar} alt={thread.userName} />
              <AvatarFallback>{thread.userName.substring(0, 2)}</AvatarFallback>
            </Avatar>
            {thread.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="font-semibold text-foreground/90">{thread.userName}</h3>
                <ContextBadge context={thread.interactionContext} />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                {formatDistanceToNow(new Date(thread.lastMessageTime), { addSuffix: true })}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground truncate mb-2">
              {thread.lastMessage}
            </p>
            
            {thread.interactionContext.title && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">Regarding:</span>
                <span className="truncate">{thread.interactionContext.title}</span>
              </div>
            )}
          </div>

          {thread.unreadCount > 0 && (
            <div className="flex flex-col items-end gap-2">
              <Badge variant="default" className="h-6 w-6 p-0 flex items-center justify-center text-xs">
                {thread.unreadCount}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  </Link>
);

export default function MessagesPage() {
  const totalUnread = mockThreads.reduce((sum, thread) => sum + thread.unreadCount, 0);

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold mb-2">Messages</h1>
            <p className="text-muted-foreground">
              Your conversations with context-aware connections
            </p>
          </div>
          <Button variant="outline" size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Start New Chat
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Conversations
              {totalUnread > 0 && (
                <Badge variant="destructive">{totalUnread} unread</Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search conversations..." className="pl-10" />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {mockThreads.length > 0 ? (
            <div className="divide-y">
              {mockThreads.map(thread => (
                <ThreadItem key={thread.id} thread={thread} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground mb-4">
                Start connecting with people through needs and offers to see messages here.
              </p>
              <Button asChild>
                <Link href="/discover">
                  Find Connections
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}