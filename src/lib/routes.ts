// Canonical application routes. A route belongs here when the surface exists.
// Primary navigation is the separate authority for whether that route is
// advertised during a consumer trial.
export const routes = {
  public: {
    home: '/',
    howItWorks: '/how-it-works',
    explore: '/explore',
    principles: '/principles',
    safety: '/safety',
    privacy: '/privacy',
    terms: '/terms',
    trialConsent: '/trial-consent',
    accountRestricted: '/account-restricted',
    login: '/login',
    signup: '/signup',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  },

  member: {
    home: '/home',
    discover: '/discover',
    needs: '/needs',
    needsCreate: '/needs/create',
    offers: '/offers',
    offersCreate: '/offers/create',
    proposals: '/proposals',
    surrogacies: '/surrogacies',
    messages: '/messages',
    rewards: '/rewards',
    profile: '/profile',
    settings: '/settings',
    blockedMembers: '/settings/blocked',
  },

  memberDynamic: {
    profile: (id: string) => `/profile/${id}`,
    need: (id: string) => `/needs/${id}`,
    offer: (id: string) => `/offers/${id}`,
    surrogacy: (id: string) => `/surrogacies/${id}`,
  },

  admin: {
    dashboard: '/admin',
    reports: '/admin/reports',
  },
} as const

export type RoutePath = typeof routes.public[keyof typeof routes.public]
  | typeof routes.member[keyof typeof routes.member]
  | typeof routes.admin[keyof typeof routes.admin]
