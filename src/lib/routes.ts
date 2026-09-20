// Canonical application routes. A route belongs here only when the surface is
// implemented and intentionally exposed by the product.
export const routes = {
  public: {
    home: '/',
    howItWorks: '/how-it-works',
    explore: '/explore',
    principles: '/principles',
    safety: '/safety',
    privacy: '/privacy',
    terms: '/terms',
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
    rewards: '/rewards',
    profile: '/profile',
    settings: '/settings',
  },

  memberDynamic: {
    profile: (id: string) => `/profile/${id}`,
    need: (id: string) => `/needs/${id}`,
    offer: (id: string) => `/offers/${id}`,
    surrogacy: (id: string) => `/surrogacies/${id}`,
  },

  admin: {
    dashboard: '/admin',
  },
} as const

export type RoutePath = typeof routes.public[keyof typeof routes.public]
  | typeof routes.member[keyof typeof routes.member]
  | typeof routes.admin[keyof typeof routes.admin]
