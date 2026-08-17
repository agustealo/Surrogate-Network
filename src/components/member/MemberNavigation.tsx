'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Search, HeartHandshake, MessageSquare, Award, User, 
  Menu, X, Plus, LogOut, Settings, Bell, Coins
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/discover', label: 'Discover', icon: Search },
  { href: '/needs', label: 'Needs', icon: HeartHandshake },
  { href: '/offers', label: 'Offers', icon: Plus },
  { href: '/surrogacies', label: 'Surrogacies', icon: HeartHandshake },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/rewards', label: 'Rewards', icon: Award },
  { href: '/profile', label: 'Profile', icon: User },
];

export function MemberNavigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <div className="p-4">
          <Link href="/home" className="flex items-center gap-2">
            <HeartHandshake className="h-6 w-6 text-primary" />
            <span className="font-bold text-foreground">Surrogate Companion</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.href === '/messages' && (
                  <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs">2</Badge>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <Link href="/settings">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-destructive">
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      <div className={cn(
        "md:hidden fixed inset-0 z-50 bg-background transition-transform",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between border-b px-4">
          <span className="font-semibold">Menu</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
          <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start mb-2">
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-destructive">
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );
}