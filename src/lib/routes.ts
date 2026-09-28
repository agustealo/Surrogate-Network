// Canonical application routes. A route belongs here only when the consumer
// surface exists and is supported by production behavior.
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
    accountDeactivated: '/account-deactivated',
    accountDeleted: '/account-deleted',
    login: '/login',
    signup: '/signup',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    authRecovery: '/auth/recovery',
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
    rewards: '/rewards',
    profile: '/profile',
    settings: '/settings',
    blockedMembers: '/settings/blocked',
    accountExport: '/account/export',
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
