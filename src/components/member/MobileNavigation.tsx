'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/routes';

const navItems = [
  { href: routes.member.home, label: 'Home', icon: Home },
  { href: routes.member.discover, label: 'Discover', icon: Search },
  { href: routes.member.messages, label: 'Messages', icon: MessageSquare },
  { href: routes.member.profile, label: 'Me', icon: User },
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
          
          <div className="relative">
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
                <Link 
                  href={routes.member.needsCreate} 
                  className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md text-sm"
                  onClick={() => setCreateMenuOpen(false)}
                >
                  <Plus className="h-4 w-4 text-pink-500" />
                  Need
                </Link>
                <Link 
                  href={routes.member.offersCreate} 
                  className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md text-sm"
                  onClick={() => setCreateMenuOpen(false)}
                >
                  <Plus className="h-4 w-4 text-purple-500" />
                  Offer
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="md:hidden h-16" />
    </>
  );
}