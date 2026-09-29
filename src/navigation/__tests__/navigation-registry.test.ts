import {
  memberNavigation,
  adminNavigation,
  publicNavigation,
  memberActions,
  filterNavigationItems,
  filterNavigationActions,
  groupNavigationBySection,
  isRouteActive,
} from '@/navigation'
import { routes } from '@/lib/routes'

describe('Navigation Registry', () => {
  it('advertises only implemented admin routes', () => {
    const ids = adminNavigation.filter((item) => 'href' in item).map((item) => item.id)
    expect(ids).toEqual(expect.arrayContaining(['dashboard', 'fyp', 'reports']))
    expect(adminNavigation).toHaveLength(3)
    expect(adminNavigation[0]).toMatchObject({ id: 'dashboard', href: routes.admin.dashboard })
    expect(adminNavigation[1]).toMatchObject({ id: 'fyp', href: routes.admin.fyp })
    expect(adminNavigation[2]).toMatchObject({ id: 'reports', href: routes.admin.reports })
  })

  it('contains every shipped consumer member destination that belongs in primary navigation', () => {
    const ids = memberNavigation.filter((item) => 'href' in item).map((item) => item.id)
    ;['home', 'discover', 'proposals', 'needs', 'offers', 'connections', 'rewards', 'profile', 'settings']
      .forEach((id) => expect(ids).toContain(id))
  })

  it('does not retain an unfinished messaging destination', () => {
    const ids = memberNavigation.filter((item) => 'href' in item).map((item) => item.id)
    expect(ids).not.toContain('messages')
    expect('messages' in routes.member).toBe(false)
    expect(routes.member.rewards).toBe('/rewards')
  })

  it('keeps navigation ids and route/surface/mode combinations unique', () => {
    for (const navigation of [memberNavigation, adminNavigation, publicNavigation]) {
      const ids = navigation.map((item) => item.id)
      expect(new Set(ids).size).toBe(ids.length)
      const combinations = navigation
        .filter((item) => 'href' in item)
        .map((item) => 'href' in item ? `${item.href}:${item.surfaces.join(',')}:${item.modes.join(',')}` : '')
      expect(new Set(combinations).size).toBe(combinations.length)
    }
  })

  it('filters by surface and mode', () => {
    expect(filterNavigationItems(memberNavigation, 'member', 'desktop').every((item) => item.surfaces.includes('member'))).toBe(true)
    expect(filterNavigationItems(memberNavigation, 'admin', 'desktop')).toHaveLength(0)
    expect(filterNavigationItems(adminNavigation, 'admin', 'desktop').every((item) => item.surfaces.includes('admin'))).toBe(true)
    expect(filterNavigationActions(memberActions, 'member', 'mobile').every((item) => item.surfaces.includes('member'))).toBe(true)
  })

  it('groups member navigation intentionally', () => {
    const grouped = groupNavigationBySection(filterNavigationItems(memberNavigation, 'member', 'desktop'))
    expect(grouped.General).toBeDefined()
    expect(grouped['My Activity']).toBeDefined()
    expect(grouped['My Activity'].some((item) => item.id === 'rewards')).toBe(true)
    expect(grouped.Account).toBeDefined()
  })

  it('matches exact and nested routes without false positives', () => {
    expect(isRouteActive('/home', '/home')).toBe(true)
    expect(isRouteActive('/needs/create', '/needs')).toBe(true)
    expect(isRouteActive('/home', '/discover')).toBe(false)
    expect(isRouteActive(null, '/home')).toBe(false)
  })

  it('contains no scaffold labels or paths', () => {
    const forbidden = ['placeholder', 'todo', 'coming-soon', 'wip', 'legacy', 'demo']
    for (const item of [...memberNavigation, ...adminNavigation, ...publicNavigation]) {
      forbidden.forEach((word) => {
        expect(item.label.toLowerCase()).not.toContain(word)
        if ('href' in item && typeof item.href === 'string') expect(item.href.toLowerCase()).not.toContain(word)
      })
    }
  })
})
