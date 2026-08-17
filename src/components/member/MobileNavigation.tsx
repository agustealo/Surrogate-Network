'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/discover', label: 'Discover', icon: Search },
  { href: '/create', label: 'Create', icon: Plus },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Me', icon: User },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            
            if (item.href === '/create') {
              return (
                <div key={item.href} className="relative">
                  <button
                    onClick={() => setCreateMenuOpen(!createMenuOpen)}
                    className={cn(
                      "flex flex-col items-center justify-center w-16 h-16 rounded-full -mt-8 border-4 border-background",
                      createMenuOpen ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs mt-1">{item.label}</span>
                  </button>
                  
                  {createMenuOpen && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-background border rounded-lg shadow-lg p-2 w-48">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Create</p>
                      <Link 
                        href="/needs/create" 
                        className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md text-sm"
                        onClick={() => setCreateMenuOpen(false)}
                      >
                        <Plus className="h-4 w-4 text-pink-500" />
                        Need
                      </Link>
                      <Link 
                        href="/offers/create" 
                        className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md text-sm"
                        onClick={() => setCreateMenuOpen(false)}
                      >
                        <Plus className="h-4 w-4 text-purple-500" />
                        Offer
                      </Link>
                      <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground text-sm cursor-not-allowed">
                        <Plus className="h-4 w-4" />
                        Pod (Coming Soon)
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground text-sm cursor-not-allowed">
                        <Plus className="h-4 w-4" />
                        Event (Coming Soon)
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="md:hidden h-16" />
    </>
  );
}