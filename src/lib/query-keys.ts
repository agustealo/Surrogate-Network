// Centralized query keys for TanStack Query
// Prevents manually constructed query keys scattered throughout the app

export const queryKeys = {
  // Legacy keys for backward compatibility
  profiles: ['profiles'] as const,
  users: ['users'] as const,
  needs: ['needs'] as const,
  offers: ['offers'] as const,
  surrogacies: ['surrogacies'] as const,
  proposals: ['proposals'] as const,
  activeConnections: ['activeConnections'] as const,
  chatSessions: ['chatSessions'] as const,

  // Profile queries
  profile: {
    all: ['profiles'] as const,
    lists: () => [...queryKeys.profile.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.profile.lists(), filters] as const,
    details: () => [...queryKeys.profile.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.profile.details(), id] as const,
    current: () => [...queryKeys.profile.all, 'current'] as const,
  },

  // Need queries
  need: {
    all: ['needs'] as const,
    lists: () => [...queryKeys.need.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.need.lists(), filters] as const,
    details: () => [...queryKeys.need.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.need.details(), id] as const,
    myNeeds: () => [...queryKeys.need.all, 'my-needs'] as const,
    compatible: (offerId: string) => [...queryKeys.need.all, 'compatible', offerId] as const,
  },

  // Offer queries
  offer: {
    all: ['offers'] as const,
    lists: () => [...queryKeys.offer.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.offer.lists(), filters] as const,
    details: () => [...queryKeys.offer.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.offer.details(), id] as const,
    myOffers: () => [...queryKeys.offer.all, 'my-offers'] as const,
    compatible: (needId: string) => [...queryKeys.offer.all, 'compatible', needId] as const,
  },

  // Surrogacy queries
  surrogacy: {
    all: ['surrogacies'] as const,
    lists: () => [...queryKeys.surrogacy.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.surrogacy.lists(), filters] as const,
    details: () => [...queryKeys.surrogacy.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.surrogacy.details(), id] as const,
    myActive: () => [...queryKeys.surrogacy.all, 'my-active'] as const,
    upcomingMoments: (id: string) => [...queryKeys.surrogacy.detail(id), 'moments', 'upcoming'] as const,
  },

  // Message queries
  message: {
    all: ['messages'] as const,
    lists: () => [...queryKeys.message.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.message.lists(), filters] as const,
    details: () => [...queryKeys.message.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.message.details(), id] as const,
    threads: () => [...queryKeys.message.all, 'threads'] as const,
    unread: () => [...queryKeys.message.all, 'unread'] as const,
  },

  // Feedback queries
  feedback: {
    all: ['feedback'] as const,
    lists: () => [...queryKeys.feedback.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.feedback.lists(), filters] as const,
    details: () => [...queryKeys.feedback.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.feedback.details(), id] as const,
    forUser: (userId: string) => [...queryKeys.feedback.all, 'user', userId] as const,
    forExchange: (exchangeId: string) => [...queryKeys.feedback.all, 'exchange', exchangeId] as const,
  },

  // Progression queries
  progression: {
    all: ['progression'] as const,
    current: () => [...queryKeys.progression.all, 'current'] as const,
    achievements: () => [...queryKeys.progression.all, 'achievements'] as const,
    ranks: () => [...queryKeys.progression.all, 'ranks'] as const,
    history: (userId: string) => [...queryKeys.progression.all, 'history', userId] as const,
  },

  // Token queries
  token: {
    all: ['tokens'] as const,
    balance: (userId: string) => [...queryKeys.token.all, 'balance', userId] as const,
    transactions: (userId: string, filters?: Record<string, unknown>) => 
      [...queryKeys.token.all, 'transactions', userId, filters] as const,
    ledger: (filters?: Record<string, unknown>) => 
      [...queryKeys.token.all, 'ledger', filters] as const,
  },

  // Admin queries
  admin: {
    all: ['admin'] as const,
    members: (filters?: Record<string, unknown>) => 
      [...queryKeys.admin.all, 'members', filters] as const,
    reports: (filters?: Record<string, unknown>) => 
      [...queryKeys.admin.all, 'reports', filters] as const,
    moderation: (filters?: Record<string, unknown>) => 
      [...queryKeys.admin.all, 'moderation', filters] as const,
    activity: () => [...queryKeys.admin.all, 'activity'] as const,
    health: () => [...queryKeys.admin.all, 'health'] as const,
  },
} as const;