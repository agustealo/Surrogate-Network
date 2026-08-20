import { describe, it, expect } from '@jest/globals';
import {
  memberNavigation,
  adminNavigation,
  publicNavigation,
  memberActions,
  filterNavigationItems,
  filterNavigationActions,
  groupNavigationBySection,
  isRouteActive,
} from '@/navigation';
import type { NavigationItem, NavigationAction } from '@/navigation';
import { routes } from '@/lib/routes';

describe('Navigation Registry', () => {
  describe('routes.ts completeness', () => {
    it('should have all admin routes defined', () => {
      const adminIds = adminNavigation
        .filter(item => 'href' in item)
        .map(item => item.id);
      
      const requiredAdminRoutes = [
        'dashboard', 'members', 'needs', 'offers', 'proposals',
        'surrogacies', 'moments', 'exchanges', 'feedback',
        'reports', 'moderation', 'media', 'tokens', 'ledger',
        'ranks', 'xp', 'audit', 'settings'
      ];
      
      requiredAdminRoutes.forEach(routeId => {
        expect(adminIds).toContain(routeId);
        expect(routes.admin[routeId as keyof typeof routes.admin]).toBeDefined();
      });
    });

    it('should have all member routes defined', () => {
      const memberIds = memberNavigation
        .filter(item => 'href' in item)
        .map(item => item.id);
      
      const requiredMemberRoutes = [
        'home', 'discover', 'messages',
        'needs', 'offers', 'profile', 'rewards', 'settings'
      ];
      
      requiredMemberRoutes.forEach(routeId => {
        expect(memberIds).toContain(routeId);
        expect(routes.member[routeId as keyof typeof routes.member]).toBeDefined();
      });
      
      expect(memberIds).toContain('connections');
      expect(memberIds).toContain('me');
      expect(routes.member.surrogacies).toBeDefined();
    });
  });

  describe('navigation uniqueness', () => {
    it('should have unique IDs in member navigation', () => {
      const ids = memberNavigation.map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique IDs in admin navigation', () => {
      const ids = adminNavigation.map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique IDs in public navigation', () => {
      const ids = publicNavigation.map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have no duplicate href+surface+mode combinations in member nav', () => {
      const combinations = memberNavigation
        .filter(item => 'href' in item)
        .map(item => `${item.href}:${item.surfaces.join(',')}:${item.modes.join(',')}`);
      
      const uniqueCombinations = new Set(combinations);
      expect(uniqueCombinations.size).toBe(combinations.length);
    });

    it('should have no duplicate href+surface+mode combinations in admin nav', () => {
      const combinations = adminNavigation
        .filter(item => 'href' in item)
        .map(item => `${item.href}:${item.surfaces.join(',')}:${item.modes.join(',')}`);
      
      const uniqueCombinations = new Set(combinations);
      expect(uniqueCombinations.size).toBe(combinations.length);
    });
  });

  describe('navigation filtering', () => {
    it('should filter member navigation by desktop mode', () => {
      const desktopItems = filterNavigationItems(memberNavigation, 'member', 'desktop');
      expect(desktopItems.every(item => item.modes.includes('desktop') || item.modes.includes('all'))).toBe(true);
    });

    it('should filter member navigation by mobile mode', () => {
      const mobileItems = filterNavigationItems(memberNavigation, 'member', 'mobile');
      expect(mobileItems.every(item => item.modes.includes('mobile') || item.modes.includes('all'))).toBe(true);
    });

    it('should filter admin navigation by desktop mode', () => {
      const adminItems = filterNavigationItems(adminNavigation, 'admin', 'desktop');
      expect(adminItems.every(item => item.modes.includes('desktop') || item.modes.includes('all'))).toBe(true);
    });

    it('should filter member actions for mobile', () => {
      const actions = filterNavigationActions(memberActions, 'member', 'mobile');
      expect(actions.every(action => action.modes.includes('mobile') || action.modes.includes('all'))).toBe(true);
    });

    it('should return empty array for mismatched surface', () => {
      const items = filterNavigationItems(memberNavigation, 'admin', 'desktop');
      expect(items).toHaveLength(0);
    });
  });

  describe('navigation grouping', () => {
    it('should group member navigation by section', () => {
      const grouped = groupNavigationBySection(
        filterNavigationItems(memberNavigation, 'member', 'desktop')
      );
      
      expect(grouped['My Activity']).toBeDefined();
      expect(grouped['Account']).toBeDefined();
    });

    it('should place items without section in General', () => {
      const grouped = groupNavigationBySection(
        filterNavigationItems(memberNavigation, 'member', 'desktop')
      );
      
      expect(grouped['General']).toBeDefined();
    });
  });

  describe('route active matching', () => {
    it('should match exact routes', () => {
      expect(isRouteActive('/home', '/home')).toBe(true);
    });

    it('should match nested routes', () => {
      expect(isRouteActive('/needs/create', '/needs')).toBe(true);
      expect(isRouteActive('/admin/members/123', '/admin/members')).toBe(true);
    });

    it('should not match different routes', () => {
      expect(isRouteActive('/home', '/discover')).toBe(false);
    });

    it('should handle null pathname', () => {
      expect(isRouteActive(null, '/home')).toBe(false);
    });
  });

  describe('no fake routes', () => {
    it('should not have placeholder routes in navigation', () => {
      const allItems = [...memberNavigation, ...adminNavigation, ...publicNavigation] as (NavigationItem | NavigationAction)[];
      const fakePatterns = ['placeholder', 'todo', 'coming-soon', 'wip'];
      
      allItems.forEach(item => {
        if ('href' in item && typeof item.href === 'string') {
          fakePatterns.forEach(pattern => {
            expect(item.href.toLowerCase()).not.toContain(pattern);
          });
        }
      });
    });

    it('should not have placeholder labels in navigation', () => {
      const allItems = [...memberNavigation, ...adminNavigation, ...publicNavigation];
      const fakePatterns = ['placeholder', 'todo', 'coming-soon', 'wip'];
      
      allItems.forEach(item => {
        fakePatterns.forEach(pattern => {
          expect(item.label.toLowerCase()).not.toContain(pattern);
        });
      });
    });
  });

  describe('admin lifecycle coverage', () => {
    it('should cover all admin lifecycle entities', () => {
      const adminItems = filterNavigationItems(adminNavigation, 'admin', 'desktop');
      const requiredEntities = [
        'needs', 'offers', 'proposals', 'surrogacies',
        'moments', 'exchanges', 'feedback'
      ];
      
      requiredEntities.forEach(entity => {
        expect(adminItems.some(item => item.id === entity)).toBe(true);
      });
    });
  });

  describe('mobile/desktop config intentionality', () => {
    it('should intentionally differ between mobile and desktop member nav', () => {
      const desktopItems = filterNavigationItems(memberNavigation, 'member', 'desktop');
      const mobileItems = filterNavigationItems(memberNavigation, 'member', 'mobile');
      
      const desktopIds = desktopItems.map(item => item.id).sort();
      const mobileIds = mobileItems.map(item => item.id).sort();
      
      expect(desktopIds).not.toEqual(mobileIds);
    });

    it('should have fewer mobile items than desktop', () => {
      const desktopItems = filterNavigationItems(memberNavigation, 'member', 'desktop');
      const mobileItems = filterNavigationItems(memberNavigation, 'member', 'mobile');
      
      expect(mobileItems.length).toBeLessThan(desktopItems.length);
    });
  });
});