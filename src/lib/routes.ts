// Route constants for the application
// Centralized to prevent scattered literal paths and broken redirects

export const routes = {
  // Public routes
  public: {
    home: '/',
    howItWorks: '/how-it-works',
    explore: '/explore',
    principles: '/principles',
    safety: '/safety',
    login: '/login',
    join: '/join',
  },

  // Member routes
  member: {
    home: '/home',
    discover: '/discover',
    needs: '/needs',
    needsCreate: '/needs/create',
    offers: '/offers',
    offersCreate: '/offers/create',
    surrogacies: '/surrogacies',
    messages: '/messages',
    rewards: '/rewards',
    profile: '/profile',
    settings: '/settings',
  },

  // Dynamic member routes
  memberDynamic: {
    profile: (id: string) => `/profile/${id}`,
    need: (id: string) => `/needs/${id}`,
    offer: (id: string) => `/offers/${id}`,
    surrogacy: (id: string) => `/surrogacies/${id}`,
    messages: (id: string) => `/messages/${id}`,
  },

  // Admin routes
  admin: {
    dashboard: '/admin',
    members: '/admin/members',
    needs: '/admin/needs',
    offers: '/admin/offers',
    proposals: '/admin/proposals',
    surrogacies: '/admin/surrogacies',
    moments: '/admin/moments',
    exchanges: '/admin/exchanges',
    feedback: '/admin/feedback',
    reports: '/admin/reports',
    moderation: '/admin/moderation',
    media: '/admin/media',
    tokens: '/admin/tokens',
    ledger: '/admin/ledger',
    ranks: '/admin/ranks',
    xp: '/admin/xp',
    audit: '/admin/audit',
    settings: '/admin/settings',
  },
} as const;

export type RoutePath = typeof routes.public[keyof typeof routes.public] 
  | typeof routes.member[keyof typeof routes.member]
  | typeof routes.admin[keyof typeof routes.admin];