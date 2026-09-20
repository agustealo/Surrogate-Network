import { routes } from '@/lib/routes'
import type { LucideIcon } from 'lucide-react'

export type NavigationSurface = 'public' | 'member' | 'admin'
export type NavigationMode = 'desktop' | 'mobile' | 'all'

export interface NavigationAction {
  id: string
  label: string
  icon?: LucideIcon
  surfaces: NavigationSurface[]
  modes: NavigationMode[]
}

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon?: LucideIcon
  surfaces: NavigationSurface[]
  modes: NavigationMode[]
  section?: string
  badge?: string
}

export const publicNavigation: (NavigationItem | NavigationAction)[] = [
  { id: 'home', label: 'Home', href: routes.public.home, surfaces: ['public'], modes: ['all'] },
  { id: 'how-it-works', label: 'How It Works', href: routes.public.howItWorks, surfaces: ['public'], modes: ['all'] },
  { id: 'explore', label: 'Explore', href: routes.public.explore, surfaces: ['public'], modes: ['all'] },
  { id: 'principles', label: 'Principles', href: routes.public.principles, surfaces: ['public'], modes: ['all'] },
  { id: 'safety', label: 'Safety', href: routes.public.safety, surfaces: ['public'], modes: ['all'] },
  { id: 'login', label: 'Sign In', href: routes.public.login, surfaces: ['public'], modes: ['all'] },
  { id: 'join', label: 'Join', href: routes.public.signup, surfaces: ['public'], modes: ['all'] },
]

// Primary navigation is intentionally narrower than the route registry. Routes
// such as Messaging and Rewards may remain reachable as truthful status/history
// surfaces, but are not advertised until their production behavior is complete.
export const memberNavigation: (NavigationItem | NavigationAction)[] = [
  { id: 'home', label: 'Home', href: routes.member.home, surfaces: ['member'], modes: ['desktop', 'mobile'] },
  { id: 'discover', label: 'Discover', href: routes.member.discover, surfaces: ['member'], modes: ['desktop', 'mobile'] },
  { id: 'proposals', label: 'Proposals', href: routes.member.proposals, surfaces: ['member'], modes: ['desktop', 'mobile'] },
  { id: 'connections', label: 'Connections', href: routes.member.surrogacies, surfaces: ['member'], modes: ['desktop', 'mobile'] },
  { id: 'me', label: 'Me', href: routes.member.profile, surfaces: ['member'], modes: ['mobile'] },
  { id: 'needs', label: 'Needs', href: routes.member.needs, surfaces: ['member'], modes: ['desktop'], section: 'My Activity' },
  { id: 'offers', label: 'Offers', href: routes.member.offers, surfaces: ['member'], modes: ['desktop'], section: 'My Activity' },
  { id: 'profile', label: 'Profile', href: routes.member.profile, surfaces: ['member'], modes: ['desktop'], section: 'Account' },
  { id: 'settings', label: 'Settings', href: routes.member.settings, surfaces: ['member'], modes: ['desktop'], section: 'Account' },
]

export const memberActions: NavigationAction[] = [
  { id: 'create', label: 'Create', surfaces: ['member'], modes: ['mobile'] },
  { id: 'create-need', label: 'Need', surfaces: ['member'], modes: ['mobile'] },
  { id: 'create-offer', label: 'Offer', surfaces: ['member'], modes: ['mobile'] },
]

const memberActionRoutes = {
  'create-need': routes.member.needsCreate,
  'create-offer': routes.member.offersCreate,
} as const

export const adminNavigation: (NavigationItem | NavigationAction)[] = [
  { id: 'dashboard', label: 'Dashboard', href: routes.admin.dashboard, surfaces: ['admin'], modes: ['desktop'], section: 'Overview' },
  { id: 'reports', label: 'Reports', href: routes.admin.reports, surfaces: ['admin'], modes: ['desktop'], section: 'Safety' },
]

export function filterNavigationBySurface<T extends NavigationItem | NavigationAction>(items: T[], surface: NavigationSurface): T[] {
  return items.filter((item) => item.surfaces.includes(surface))
}

export function filterNavigationByMode<T extends NavigationItem | NavigationAction>(items: T[], mode: NavigationMode): T[] {
  return items.filter((item) => item.modes.includes(mode) || item.modes.includes('all'))
}

export function filterNavigationItems(items: (NavigationItem | NavigationAction)[], surface: NavigationSurface, mode: NavigationMode): NavigationItem[] {
  return items
    .filter((item) => item.surfaces.includes(surface))
    .filter((item) => item.modes.includes(mode) || item.modes.includes('all'))
    .filter((item): item is NavigationItem => 'href' in item)
}

export function filterNavigationActions(items: (NavigationItem | NavigationAction)[], surface: NavigationSurface, mode: NavigationMode): NavigationAction[] {
  return items
    .filter((item) => item.surfaces.includes(surface))
    .filter((item) => item.modes.includes(mode) || item.modes.includes('all'))
    .filter((item): item is NavigationAction => !('href' in item))
}

export function getMemberActionHref(actionId: string): string | null {
  return memberActionRoutes[actionId as keyof typeof memberActionRoutes] ?? null
}

export function groupNavigationBySection(items: NavigationItem[]): Record<string, NavigationItem[]> {
  return items.reduce<Record<string, NavigationItem[]>>((grouped, item) => {
    const section = item.section || 'General'
    grouped[section] ??= []
    grouped[section].push(item)
    return grouped
  }, {})
}

export function isRouteActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}
