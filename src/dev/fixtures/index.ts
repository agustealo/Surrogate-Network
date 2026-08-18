// Demo fixtures for development and testing
// Centralized to prevent scattered demo data in production pages

import type { Profile } from '@/domain/types';
import type { Proposal, ActiveConnection, ChatSession } from '@/lib/types';
import type { Need as DomainNeed, Offer as DomainOffer } from '@/domain/types';

// Aliases for legacy compatibility
type Need = DomainNeed;
type Offer = DomainOffer;

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
    proposingUser: mockUsers.elara,
    theirOffering: { 
      id: 'o1', 
      title: 'Empathetic Listener', 
      category: 'personal' 
    },
    forYourRequest: { 
      id: 'r-user-1', 
      title: 'Mindfulness Buddy', 
      category: 'personal' 
    },
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    message: "I saw you're looking for a mindfulness buddy. I'm also on a journey of presence and would love to offer my listening skills.",
  },
  {
    id: 'prop2',
    proposingUser: mockUsers.marcus,
    theirOffering: { 
      id: 'o4', 
      title: 'Home-Cooked Meals with Love', 
      category: 'personal' 
    },
    forYourRequest: { 
      id: 'r-user-2', 
      title: 'Someone to Share Stories With', 
      category: 'casual' 
    },
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export const mockActiveConnections: ActiveConnection[] = [
  {
    id: 'conn1',
    partner: mockUsers.caleb,
    yourOffering: { 
      id: 'o-user-3', 
      title: 'Technical Troubleshooting', 
      category: 'utilitarian_business' 
    },
    theirOffering: { 
      id: 'o7', 
      title: 'Deep Conversation Partner', 
      category: 'personal' 
    },
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    status: 'active',
  },
];

export const mockChatSessions: ChatSession[] = [
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
    ],
  },
  {
    id: 'chat2',
    userId: '2',
    userName: 'Marcus Thorne',
    lastMessage: 'I found a new recipe I\'d love to try cooking for someone. Interested?',
    unreadCount: 0,
    avatarUrl: 'https://placehold.co/100x100.png?text=MT',
    timestamp: 'Yesterday',
    interactionFocus: 'offering',
    offerings: [
      { id: 'o3', title: 'Engaging Book/Film Talks', category: 'casual' },
      { id: 'o4', title: 'Home-Cooked Meals with Love', category: 'personal' },
    ],
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