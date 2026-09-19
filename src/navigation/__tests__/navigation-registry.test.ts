import { memberNavigation, adminNavigation, publicNavigation, memberActions, filterNavigationItems, filterNavigationActions, groupNavigationBySection, isRouteActive } from '@/navigation';
import { routes } from '@/lib/routes';

describe('Navigation Registry', () => {
  it('advertises only implemented admin routes', () => {
    expect(adminNavigation).toHaveLength(1);
    expect(adminNavigation[0]).toMatchObject({ id: 'dashboard', href: routes.admin.dashboard });
  });

  it('contains the canonical member destinations', () => {
    const ids = memberNavigation.filter(item => 'href' in item).map(item => item.id);
    ['home','discover','messages','needs','offers','connections','profile','rewards','settings'].forEach(id => expect(ids).toContain(id));
  });

  it('keeps navigation ids and route/surface/mode combinations unique', () => {
    for (const navigation of [memberNavigation, adminNavigation, publicNavigation]) {
      const ids = navigation.map(item => item.id);
      expect(new Set(ids).size).toBe(ids.length);
      const combinations = navigation.filter(item => 'href' in item).map(item => 'href' in item ? `${item.href}:${item.surfaces.join(',')}:${item.modes.join(',')}` : '');
      expect(new Set(combinations).size).toBe(combinations.length);
    }
  });

  it('filters by surface and mode', () => {
    expect(filterNavigationItems(memberNavigation, 'member', 'desktop').every(item => item.surfaces.includes('member'))).toBe(true);
    expect(filterNavigationItems(memberNavigation, 'admin', 'desktop')).toHaveLength(0);
    expect(filterNavigationItems(adminNavigation, 'admin', 'desktop').every(item => item.surfaces.includes('admin'))).toBe(true);
    expect(filterNavigationActions(memberActions, 'member', 'mobile').every(item => item.surfaces.includes('member'))).toBe(true);
  });

  it('groups member navigation intentionally', () => {
    const grouped = groupNavigationBySection(filterNavigationItems(memberNavigation, 'member', 'desktop'));
    expect(grouped.General).toBeDefined();
    expect(grouped['My Activity']).toBeDefined();
    expect(grouped.Account).toBeDefined();
  });

  it('matches exact and nested routes without false positives', () => {
    expect(isRouteActive('/home', '/home')).toBe(true);
    expect(isRouteActive('/needs/create', '/needs')).toBe(true);
    expect(isRouteActive('/home', '/discover')).toBe(false);
    expect(isRouteActive(null, '/home')).toBe(false);
  });

  it('contains no scaffold labels or paths', () => {
    const forbidden = ['placeholder','todo','coming-soon','wip','legacy','demo'];
    for (const item of [...memberNavigation, ...adminNavigation, ...publicNavigation]) {
      forbidden.forEach(word => {
        expect(item.label.toLowerCase()).not.toContain(word);
        if ('href' in item) expect(item.href.toLowerCase()).not.toContain(word);
      });
    }
  });
});
