
'use client';
import { PageWrapper } from '@/components/layout/PageWrapper';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Clock, Gift, Handshake, HelpCircle, Inbox, RefreshCw, Send, ThumbsDown, XCircle, Star, Trophy } from 'lucide-react';
import type { Proposal, ActiveConnection, User, Offering, Request } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';

// This would typically be dynamic metadata
// export const metadata: Metadata = {
//   title: 'Dashboard - Surrogate Network',
//   description: 'Manage your proposals and active connections.',
// };


// --- MOCKED DATA ---
const currentUser: User = { id: 'currentUser', name: 'You', avatarUrl: 'https://placehold.co/100x100.png?text=ME' };
const elara: User = { id: '1', name: 'Elara Vance', avatarUrl: 'https://placehold.co/100x100.png?text=EV' };
const marcus: User = { id: '2', name: 'Marcus Thorne', avatarUrl: 'https://placehold.co/100x100.png?text=MT' };
const caleb: User = { id: 'caleb', name: 'Caleb Greene', avatarUrl: 'https://placehold.co/100x100.png?text=CG' };

const incomingProposals: Proposal[] = [
    {
        id: 'prop1',
        proposingUser: elara,
        theirOffering: { id: 'o1', title: 'Empathetic Listener', category: 'personal' },
        forYourRequest: { id: 'r-user-1', title: 'Mindfulness Buddy', category: 'personal' },
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        message: "I saw you're looking for a mindfulness buddy. I'm also on a journey of presence and would love to offer my listening skills. Perhaps we can support each other?"
    },
    {
        id: 'prop2',
        proposingUser: marcus,
        theirOffering: { id: 'o4', title: 'Home-Cooked Meals with Love', category: 'personal' },
        forYourRequest: { id: 'r-user-2', title: 'Someone to Share Stories With', category: 'casual' },
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    }
];

const outgoingProposals: Proposal[] = [
    {
        id: 'prop3',
        proposingUser: currentUser,
        theirOffering: { id: 'o-user-1', title: 'Graphic Design Help', category: 'utilitarian_business' },
        forYourRequest: { id: 'r4', title: 'Art Exhibit Partner', category: 'casual' },
        status: 'accepted',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    },
    {
        id: 'prop4',
        proposingUser: currentUser,
        theirOffering: { id: 'o-user-2', title: 'Dog Walking', category: 'casual' },
        forYourRequest: { id: 'r8', title: 'Platonic Cuddle Buddy', category: 'personal' },
        status: 'declined',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    }
];

const activeConnections: ActiveConnection[] = [
    {
        id: 'conn1',
        partner: caleb,
        yourOffering: { id: 'o-user-3', title: 'Technical Troubleshooting', category: 'utilitarian_business' },
        theirOffering: { id: 'o7', title: 'Deep Conversation Partner', category: 'personal' },
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        status: 'active'
    }
]

// --- END MOCKED DATA ---

const StatusBadge = ({ status }: { status: Proposal['status'] | ActiveConnection['status'] }) => {
  const statusMap = {
    pending: { icon: Clock, label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    accepted: { icon: CheckCircle, label: 'Accepted', color: 'bg-green-100 text-green-800 border-green-300' },
    declined: { icon: XCircle, label: 'Declined', color: 'bg-red-100 text-red-800 border-red-300' },
    active: { icon: RefreshCw, label: 'Active', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    completed: { icon: CheckCircle, label: 'Completed', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    archived: { icon: XCircle, label: 'Archived', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  };

  const currentStatus = statusMap[status];
  if (!currentStatus) return null;

  const Icon = currentStatus.icon;

  return (
    <Badge variant="outline" className={cn('gap-1.5 pl-2 pr-2.5 py-1 text-xs', currentStatus.color)}>
        <Icon className="h-3.5 w-3.5" />
        {currentStatus.label}
    </Badge>
  );
};


export default function DashboardPage() {
    return (
        <PageWrapper title="Dashboard" className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- Main Column --- */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Incoming Proposals */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl text-purple-700">
                                <Inbox className="h-7 w-7"/>
                                Incoming Proposals
                            </CardTitle>
                            <CardDescription>Offers from others for your requests. Respond to start a connection.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {incomingProposals.length > 0 ? incomingProposals.map(p => (
                                <Card key={p.id} className="p-4 bg-muted/30">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage src={p.proposingUser.avatarUrl} alt={p.proposingUser.name} />
                                            <AvatarFallback>{p.proposingUser.name.substring(0,2)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm">
                                                    <Link href={`/profile/${p.proposingUser.id}`} className="font-bold hover:underline">{p.proposingUser.name}</Link> wants to offer their <span className="font-semibold text-purple-600">{p.theirOffering.title}</span> for your need: <span className="font-semibold text-pink-600">{p.forYourRequest.title}</span>
                                                </p>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</span>
                                            </div>
                                            {p.message && <p className="text-xs text-muted-foreground mt-2 border-l-2 pl-2 italic">"{p.message}"</p>}
                                            <div className="mt-3 flex items-center justify-between">
                                                <StatusBadge status={p.status} />
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" className="hover:bg-destructive/10 hover:border-destructive text-destructive"><ThumbsDown className="mr-1.5 h-4 w-4"/>Decline</Button>
                                                    <Button size="sm"><CheckCircle className="mr-1.5 h-4 w-4"/>Accept</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )) : <p className="text-muted-foreground text-sm text-center py-4">No incoming proposals right now.</p>}
                        </CardContent>
                    </Card>

                    {/* Outgoing Proposals */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl text-purple-700">
                                <Send className="h-7 w-7"/>
                                Outgoing Proposals
                            </CardTitle>
                            <CardDescription>Offers you've made to others.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {outgoingProposals.length > 0 ? outgoingProposals.map(p => (
                                <Card key={p.id} className="p-4 bg-muted/30">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                                            <AvatarFallback>ME</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                 <p className="text-sm">
                                                    You offered your <span className="font-semibold text-purple-600">{p.theirOffering.title}</span> for their need: <span className="font-semibold text-pink-600">{p.forYourRequest.title}</span>
                                                </p>
                                                 <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</span>
                                            </div>
                                             <div className="mt-3 flex items-center justify-between">
                                                <StatusBadge status={p.status} />
                                                <Button size="sm" variant="outline" disabled={p.status !== 'pending'}>
                                                    <XCircle className="mr-1.5 h-4 w-4"/>Withdraw
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )) : <p className="text-muted-foreground text-sm text-center py-4">You haven't sent any proposals yet.</p>}
                        </CardContent>
                    </Card>

                </div>

                {/* --- Side Column --- */}
                <div className="lg:col-span-1 space-y-8">

                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl text-purple-700">
                                <Trophy className="h-6 w-6"/>
                                Your Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between items-end mb-1">
                                    <p className="font-bold text-lg">Lv. 5 - Messenger</p>
                                    <p className="text-sm text-muted-foreground font-mono">150/500 XP</p>
                                </div>
                                <Progress value={30} className="h-2 [&>*]:bg-purple-500" />
                            </div>
                            <div className="text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">Next Unlock at Lv. 6:</span> Send audio notes in DMs.
                            </div>
                            <Button variant="outline" size="sm" className="w-full">View Rank Ladder</Button>
                        </CardContent>
                    </Card>


                     <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl text-purple-700">
                                <Handshake className="h-7 w-7"/>
                                Active Connections
                            </CardTitle>
                             <CardDescription>Your ongoing surrogate relationships.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {activeConnections.length > 0 ? activeConnections.map(c => (
                                 <Card key={c.id} className="p-4">
                                     <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage src={c.partner.avatarUrl} alt={c.partner.name} />
                                            <AvatarFallback>{c.partner.name.substring(0,2)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <Link href={`/profile/${c.partner.id}`} className="font-bold hover:underline">{c.partner.name}</Link>
                                            <p className="text-xs text-muted-foreground">Started {formatDistanceToNow(new Date(c.startedAt), { addSuffix: true })}</p>
                                        </div>
                                     </div>
                                     <div className="mt-3 text-sm space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Gift className="h-4 w-4 text-purple-600 shrink-0"/>
                                            <p><span className="font-semibold">You Give:</span> {c.yourOffering.title}</p>
                                        </div>
                                         <div className="flex items-center gap-2">
                                            <RefreshCw className="h-4 w-4 text-pink-600 shrink-0"/>
                                            <p><span className="font-semibold">You Get:</span> {c.theirOffering.title}</p>
                                        </div>
                                     </div>
                                      <div className="mt-4 flex flex-col gap-2">
                                        <Button size="sm" variant="default" className="w-full">
                                            Go to Chat <ArrowRight className="ml-1.5 h-4 w-4"/>
                                        </Button>
                                        <Button size="sm" variant="outline" className="w-full">End Connection</Button>
                                     </div>
                                 </Card>
                             )) : (
                                <div className="text-center py-6">
                                    <p className="text-sm text-muted-foreground">No active connections.</p>
                                    <Button asChild variant="link" className="mt-1">
                                        <Link href="/matches">Find new connections</Link>
                                    </Button>
                                </div>
                             )}
                        </CardContent>
                     </Card>
                     <Card className="shadow-md bg-muted/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl"><HelpCircle className="text-muted-foreground h-6 w-6"/>How it works</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p>1. Find a need you can fulfill on the <Link href="/matches" className="text-primary font-semibold hover:underline">Surrogacy</Link> page.</p>
                            <p>2. "Pitch an Offer" from their profile to start a proposal.</p>
                            <p>3. Once accepted, they appear under "Active Connections".</p>
                            <p>4. Chat, connect, and fulfill your surrogate agreement!</p>
                        </CardContent>
                     </Card>
                </div>
            </div>
        </PageWrapper>
    );
