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
    signup: '/signup',
    forgotPassword: '/forgot-password',
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

  // Admin routes
  admin: {
    dashboard: '/admin',
  },
} as const;

export type RoutePath = typeof routes.public[keyof typeof routes.public] 
  | typeof routes.member[keyof typeof routes.member]
  | typeof routes.admin[keyof typeof routes.admin];