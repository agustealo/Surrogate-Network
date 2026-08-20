'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  memberNavigation,
  memberActions,
  filterNavigationItems,
  filterNavigationActions,
  isRouteActive,
} from '@/navigation';

const ICON_MAP: Record<string, React.ElementType> = {
  home: Home,
  discover: Search,
  connections: MessageSquare,
  messages: MessageSquare,
  me: User,
};

export function MobileNavigation() {
  const pathname = usePathname();
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const mobileItems = filterNavigationItems(memberNavigation, 'member', 'mobile');
  const mobileActions = filterNavigationActions(memberActions, 'member', 'mobile');

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="flex items-center justify-around h-16">
          {mobileItems.map((item) => {
            const Icon = item.icon || ICON_MAP[item.id] || Home;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full transition-colors",
                  isRouteActive(pathname, item.href)
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
          
          {mobileActions.map((action) => {
            if (action.id === 'create') {
              return (
                <div key={action.id} className="relative">
                  <button
                    onClick={() => setCreateMenuOpen(!createMenuOpen)}
                    className={cn(
                      "flex flex-col items-center justify-center w-16 h-full transition-colors",
                      createMenuOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-xs mt-1">Create</span>
                  </button>
                  
                  {createMenuOpen && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-background border rounded-lg shadow-lg p-2 w-48">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Create</p>
                      {mobileActions
                        .filter(a => a.id !== 'create')
                        .map((subAction) => (
                          <Link
                            key={subAction.id}
                            href={subAction.id === 'create-need' ? '/needs/create' : '/offers/create'}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md text-sm"
                            onClick={() => setCreateMenuOpen(false)}
                          >
                            <Plus className="h-4 w-4 text-pink-500" />
                            {subAction.label}
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
      
      <div className="md:hidden h-16" />
    </>
  );
}