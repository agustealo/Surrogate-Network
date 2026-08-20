// Demo fixtures for development and testing
// Centralized to prevent scattered demo data in production pages

import type { Profile, Proposal } from '@/domain/types';
import type { Need as DomainNeed, Offer as DomainOffer } from '@/domain/types';

// Aliases for legacy compatibility
type Need = DomainNeed;
type Offer = DomainOffer;
export type ActiveConnection = {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  status: 'active' | 'paused' | 'completed';
  lastActivity: string;
  needsShared?: string[];
  offersShared?: string[];
};

export type ChatSession = {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  messages: ChatMessage[];
  unreadCount?: number;
  lastMessageAt?: string;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  readAt?: string;
};

export const mockUsers = {
  currentUser: {
    id: 'currentUser',
    name: 'You',
    avatarUrl: 'https://placehold.co/100x100.png?text=ME',
    email: 'user@example.com',
  },
  elara: {
    id: '1',
    name: 'Elara Vance',
    avatarUrl: 'https://placehold.co/100x100.png?text=EV',
  },
  marcus: {
    id: '2',
    name: 'Marcus Thorne',
    avatarUrl: 'https://placehold.co/100x100.png?text=MT',
  },
  caleb: {
    id: 'caleb',
    name: 'Caleb Greene',
    avatarUrl: 'https://placehold.co/100x100.png?text=CG',
  },
  jordan: {
    id: 'jordan',
    name: 'Jordan Smith',
    avatarUrl: 'https://placehold.co/100x100.png?text=JS',
  },
  alex: {
    id: 'alex',
    name: 'Alex Rivera',
    avatarUrl: 'https://placehold.co/100x100.png?text=AR',
  },
  sam: {
    id: 'sam',
    name: 'Sam Taylor',
    avatarUrl: 'https://placehold.co/100x100.png?text=ST',
  },
};

export const mockProposals: Proposal[] = [
  {
    id: 'prop1',
    proposingUserId: mockUsers.elara.id,
    receivingUserId: 'currentUser',
    needId: 'r-user-1',
    offerId: 'o1',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    message: "I saw you're looking for a mindfulness buddy. I'm also on a journey of presence and would love to offer my listening skills.",
  },
  {
    id: 'prop2',
    proposingUserId: mockUsers.marcus.id,
    receivingUserId: 'currentUser',
    needId: 'r-user-2',
    offerId: 'o4',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    message: "I'd love to share stories and home-cooked meals. Let's create some meaningful moments together.",
  },
];

export const mockActiveConnections: ActiveConnection[] = [
  {
    id: 'conn1',
    partnerId: mockUsers.caleb.id,
    partnerName: mockUsers.caleb.name,
    partnerAvatar: mockUsers.caleb.avatarUrl,
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    status: 'active',
  },
];

export const mockChatSessions: ChatSession[] = [
  {
    id: 'chat1',
    partnerId: mockUsers.caleb.id,
    partnerName: 'Elara Vance',
    partnerAvatar: 'https://placehold.co/100x100.png?text=EV',
    messages: [
      { 
        id: 'm1', 
        senderId: mockUsers.caleb.id, 
        senderName: 'Elara Vance', 
        content: 'That cafe exploration idea sounds lovely! When are you free?', 
        timestamp: '11:45 AM' 
      }
    ],
    unreadCount: 1,
    lastMessageAt: '11:45 AM',
  },
  {
    id: 'chat2',
    partnerId: mockUsers.marcus.id,
    partnerName: 'Marcus Thorne',
    partnerAvatar: 'https://placehold.co/100x100.png?text=MT',
    messages: [
      { 
        id: 'm2', 
        senderId: mockUsers.marcus.id, 
        senderName: 'Marcus Thorne', 
        content: 'I found a new recipe I\'d love to try cooking for someone. Interested?', 
        timestamp: 'Yesterday' 
      }
    ],
    unreadCount: 0,
    lastMessageAt: 'Yesterday',
  },
];

export const mockNeeds: any[] = [
  {
    id: 'need-1',
    title: 'Late Night Conversation',
    description: 'Looking for someone to share deep conversations during quiet hours when everyone else is asleep',
    category: 'personal',
    tags: ['Conversation', 'Deep Talk', 'Night Owl'],
    locationMode: 'remote',
    timing: 'Tue-Thu · 8 PM-11 PM',
    boundaries: ['platonic', 'virtual', 'recurring'],
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
    locationMode: 'local',
    timing: 'Weekends',
    boundaries: ['platonic', 'physical', 'one-time'],
    urgency: 'low',
    userId: 'user-2',
    userName: 'Alex Rivera',
    userAvatar: 'https://placehold.co/100x100.png?text=AR',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

export const mockOffers: any[] = [
  {
    id: 'offer-1',
    title: 'Deep Conversation Partner',
    description: 'I offer a listening ear and engaging discussions about philosophy, life, and ideas',
    category: 'personal',
    compatibility: 94,
    locationMode: 'remote or nearby',
    timing: 'Flexible',
    boundaries: ['platonic', 'virtual', 'recurring'],
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
    locationMode: 'remote',
    timing: 'Mon-Fri · 6 AM-8 AM',
    boundaries: ['platonic', 'virtual', 'recurring'],
    userId: 'user-4',
    userName: 'Sam Taylor',
    userAvatar: 'https://placehold.co/100x100.png?text=ST',
    rating: 4.7,
    reviewCount: 22,
  },
];

export const mockSurrogacies: any[] = [
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

// Use these fixtures only in development, tests, or explicit demo mode
export const isDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || 
         window.location.hostname === 'localhost';
};

export const getDemoData = <T>(key: keyof typeof mockFixtures, fallback?: T): T => {
  if (!isDemoMode()) {
    return fallback as T;
  }
  return mockFixtures[key] as T;
};

const mockFixtures = {
  users: mockUsers,
  proposals: mockProposals,
  activeConnections: mockActiveConnections,
  chatSessions: mockChatSessions,
  needs: mockNeeds,
  offers: mockOffers,
  surrogacies: mockSurrogacies,
};