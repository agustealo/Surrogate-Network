'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  memberNavigation,
  memberActions,
  filterNavigationItems,
  filterNavigationActions,
  getMemberActionHref,
  isRouteActive,
} from '@/navigation';

const ICON_MAP: Record<string, React.ElementType> = {
  home: Home,
  discover: Search,
  connections: MessageSquare,
  me: User,
};

export function MobileNavigation() {
  const pathname = usePathname();
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const mobileItems = filterNavigationItems(memberNavigation, 'member', 'mobile');
  const mobileActions = filterNavigationActions(memberActions, 'member', 'mobile');
  const createActions = mobileActions.filter((action) => action.id !== 'create' && getMemberActionHref(action.id));

  useEffect(() => {
    setCreateMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!createMenuOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setCreateMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setCreateMenuOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [createMenuOpen]);

  return (
    <nav aria-label="Member mobile navigation" className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16 items-stretch justify-around">
        {mobileItems.map((item) => {
          const Icon = item.icon || ICON_MAP[item.id] || Home;
          const active = isRouteActive(pathname, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-sm px-1 text-center text-[11px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
        {mobileActions.some((action) => action.id === 'create') && (
          <div ref={menuRef} className="relative flex min-w-0 flex-1">
            <button
              ref={triggerRef}
              type="button"
              aria-expanded={createMenuOpen}
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={() => setCreateMenuOpen((open) => !open)}
              className={cn(
                'flex h-full w-full flex-col items-center justify-center gap-1 rounded-sm px-1 text-[11px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
                createMenuOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              <span>Create</span>
            </button>
            {createMenuOpen && (
              <div
                id={menuId}
                aria-label="Create a Need or Offer"
                className="absolute bottom-full right-1 mb-2 w-48 rounded-lg border bg-background p-2 shadow-lg"
              >
                <p className="mb-2 px-2 text-xs font-semibold text-muted-foreground">Create</p>
                {createActions.map((action) => (
                  <Link
                    key={action.id}
                    href={getMemberActionHref(action.id)!}
                    className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                    onClick={() => setCreateMenuOpen(false)}
                  >
                    <Plus className="h-4 w-4 text-primary" aria-hidden="true" />
                    {action.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
