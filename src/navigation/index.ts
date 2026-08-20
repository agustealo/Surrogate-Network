// Navigation architecture for SC-00.5 Runtime Truth & Intelligence Readiness
// Centralized navigation registry with canonical route consumption

import { routes } from '@/lib/routes';
import type { LucideIcon } from 'lucide-react';

// Navigation surface types
export type NavigationSurface = 'public' | 'member' | 'admin';
export type NavigationMode = 'desktop' | 'mobile' | 'all';

// Action item type (for non-navigational items like Create)
export interface NavigationAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  surfaces: NavigationSurface[];
  modes: NavigationMode[];
}

// Navigation item type
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  surfaces: NavigationSurface[];
  modes: NavigationMode[];
  section?: string;
  badge?: string;
}

// Public navigation configuration
export const publicNavigation: (NavigationItem | NavigationAction)[] = [
  {
    id: 'home',
    label: 'Home',
    href: routes.public.home,
    surfaces: ['public'],
    modes: ['all'],
  },
  {
    id: 'how-it-works',
    label: 'How It Works',
    href: routes.public.howItWorks,
    surfaces: ['public'],
    modes: ['all'],
  },
  {
    id: 'explore',
    label: 'Explore',
    href: routes.public.explore,
    surfaces: ['public'],
    modes: ['all'],
  },
  {
    id: 'principles',
    label: 'Principles',
    href: routes.public.principles,
    surfaces: ['public'],
    modes: ['all'],
  },
  {
    id: 'safety',
    label: 'Safety',
    href: routes.public.safety,
    surfaces: ['public'],
    modes: ['all'],
  },
  {
    id: 'login',
    label: 'Sign In',
    href: routes.public.login,
    surfaces: ['public'],
    modes: ['all'],
  },
  {
    id: 'join',
    label: 'Join',
    href: routes.public.join,
    surfaces: ['public'],
    modes: ['all'],
  },
];

// Member navigation configuration - canonical journey-focused IA
export const memberNavigation: (NavigationItem | NavigationAction)[] = [
  {
    id: 'home',
    label: 'Home',
    href: routes.member.home,
    surfaces: ['member'],
    modes: ['desktop', 'mobile'],
  },
  {
    id: 'discover',
    label: 'Discover',
    href: routes.member.discover,
    surfaces: ['member'],
    modes: ['desktop', 'mobile'],
  },
  {
    id: 'connections',
    label: 'Connections',
    href: routes.member.surrogacies,
    surfaces: ['member'],
    modes: ['desktop', 'mobile'],
  },
  {
    id: 'messages',
    label: 'Messages',
    href: routes.member.messages,
    surfaces: ['member'],
    modes: ['desktop', 'mobile'],
  },
  {
    id: 'me',
    label: 'Me',
    href: routes.member.profile,
    surfaces: ['member'],
    modes: ['mobile'],
  },
  {
    id: 'needs',
    label: 'Needs',
    href: routes.member.needs,
    surfaces: ['member'],
    modes: ['desktop'],
    section: 'My Activity',
  },
  {
    id: 'offers',
    label: 'Offers',
    href: routes.member.offers,
    surfaces: ['member'],
    modes: ['desktop'],
    section: 'My Activity',
  },
  {
    id: 'profile',
    label: 'Profile',
    href: routes.member.profile,
    surfaces: ['member'],
    modes: ['desktop'],
    section: 'Account',
  },
  {
    id: 'rewards',
    label: 'Rewards',
    href: routes.member.rewards,
    surfaces: ['member'],
    modes: ['desktop'],
    section: 'Account',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: routes.member.settings,
    surfaces: ['member'],
    modes: ['desktop'],
    section: 'Account',
  },
];

// Member actions (not routes)
export const memberActions: NavigationAction[] = [
  {
    id: 'create',
    label: 'Create',
    surfaces: ['member'],
    modes: ['mobile'],
  },
  {
    id: 'create-need',
    label: 'Need',
    surfaces: ['member'],
    modes: ['mobile'],
  },
  {
    id: 'create-offer',
    label: 'Offer',
    surfaces: ['member'],
    modes: ['mobile'],
  },
];

// Admin navigation configuration - canonical lifecycle coverage
export const adminNavigation: (NavigationItem | NavigationAction)[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: routes.admin.dashboard,
    surfaces: ['admin'],
    modes: ['desktop'],
    section: 'Overview',
  },
  {
    id: 'members',
    label: 'Members',
    href: routes.admin.members,
    surfaces: ['admin'],
    modes: ['desktop'],
    section: 'Members',
  },
  {
    id: 'needs',
    label: 'Needs',
    href: routes.admin.needs,
    surfaces: ['admin'],
    modes: ['desktop'],
    section: 'Relationships',
  },
  {
    id: 'offers',
    label: 'Offers',
    href: routes.admin.offers,
    surfaces: ['admin'],
    modes: ['desktop'],
    section: 'Relationships',
  },
  {
    id: 'surrogacies',
    label: 'Surrogacies',
    href: routes.admin.surrogacies,
    surfaces: ['admin'],
    modes: ['desktop'],
    section: 'Relationships',
  },
  {
    id: 'feedback',
    label: 'Feedback',
    href: routes.admin.feedback,
    surfaces: ['admin'],
    modes: ['desktop'],
    section: 'Relationships',
  },
  {
    id: 'reports',
    label: 'Reports',
    href: routes.admin.reports,
    surfaces: ['admin'],
    modes: ['desktop'],
    section: 'Trust & Safety',
  },
  {
    id: 'moderation',
    label: 'Moderation Queue',
    href: routes.admin.moderation,
    surfaces: ['admin'],
    modes: ['desktop'],
    section: 'Trust & Safety',
  },
  {
    id: 'media',
    label: 'Media Review',
    href: routes.admin.media,
    surfaces: ['admin'],
    modes: ['desktop'],
    section: 'Trust & Safety',
  },
  {
    id: 'tokens',
    label: 'Tokens',
    href: routes.admin.tokens,
    surfaces: ['admin'],
    modes: ['desktop'],
    section: 'Economy',
  },
  {
    id: 'ledger',
    label: 'Ledger',
    href: routes.admin.ledger,
    surfaces: ['admin'],
    modes: ['desktop'],
    section: 'Economy',
  },
  {
    id: 'ranks',
    label: 'Ranks',
    href: routes.admin.ranks,
    surfaces: ['admin'],
    modes: ['desktop'],
    section: 'Progression',
  },
  {
    id: 'xp',
    label: 'XP',
    href: routes.admin.xp,
    surfaces: ['admin'],
    modes: ['desktop'],
    section: 'Progression',
  },
  {
    id: 'audit',
    label: 'Audit Log',
    href: routes.admin.audit,
    surfaces: ['admin'],
    modes: ['desktop'],
    section: 'System',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: routes.admin.settings,
    surfaces: ['admin'],
    modes: ['desktop'],
    section: 'System',
  },
];

// Helper functions for navigation filtering
export function filterNavigationBySurface<T extends NavigationItem | NavigationAction>(
  items: T[],
  surface: NavigationSurface
): T[] {
  return items.filter(item => item.surfaces.includes(surface));
}

export function filterNavigationByMode<T extends NavigationItem | NavigationAction>(
  items: T[],
  mode: NavigationMode
): T[] {
  return items.filter(item => item.modes.includes(mode) || item.modes.includes('all'));
}

export function filterNavigationItems(
  items: (NavigationItem | NavigationAction)[],
  surface: NavigationSurface,
  mode: NavigationMode
): NavigationItem[] {
  return items
    .filter(item => item.surfaces.includes(surface))
    .filter(item => item.modes.includes(mode) || item.modes.includes('all'))
    .filter((item): item is NavigationItem => 'href' in item);
}

export function filterNavigationActions(
  items: (NavigationItem | NavigationAction)[],
  surface: NavigationSurface,
  mode: NavigationMode
): NavigationAction[] {
  return items
    .filter(item => item.surfaces.includes(surface))
    .filter(item => item.modes.includes(mode) || item.modes.includes('all'))
    .filter((item): item is NavigationAction => !('href' in item));
}

export function groupNavigationBySection(items: NavigationItem[]): Record<string, NavigationItem[]> {
  const grouped: Record<string, NavigationItem[]> = {};
  
  items.forEach(item => {
    const section = item.section || 'General';
    if (!grouped[section]) {
      grouped[section] = [];
    }
    grouped[section].push(item);
  });
  
  return grouped;
}

// Active route matching utility
export function isRouteActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(href + '/');
}