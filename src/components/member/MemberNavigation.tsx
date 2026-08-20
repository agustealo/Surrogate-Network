'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HeartHandshake, Settings, LogOut,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from 'react';
import {
  memberNavigation,
  memberActions,
  filterNavigationItems,
  filterNavigationActions,
  groupNavigationBySection,
  isRouteActive,
} from '@/navigation';
import type { NavigationItem } from '@/navigation';

export function MemberNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [myActivityOpen, setMyActivityOpen] = useState(() => {
    return filterNavigationItems(memberNavigation, 'member', 'desktop')
      .some(item => isRouteActive(pathname, item.href));
  });
  const [accountOpen, setAccountOpen] = useState(() => {
    return filterNavigationItems(memberNavigation, 'member', 'desktop')
      .some(item => isRouteActive(pathname, item.href));
  });

  const desktopItems = filterNavigationItems(memberNavigation, 'member', 'desktop');
  const grouped = groupNavigationBySection(desktopItems);

  const handleLogout = async () => {
    try {
      const { createClient } = await import('@/infrastructure/supabase/browser');
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <div className="p-4">
        <Link href="/home" className="flex items-center gap-2">
          <HeartHandshake className="h-6 w-6 text-primary" />
          <span className="font-bold text-foreground">Surrogate Companion</span>
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {desktopItems.filter(item => !item.section).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isRouteActive(pathname, item.href)
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.label}
            </Link>
          );
        })}

        {Object.entries(grouped).map(([section, items]) => (
          <NavSection
            key={section}
            section={section}
            items={items}
            pathname={pathname}
            defaultOpen={section === 'My Activity' ? myActivityOpen : section === 'Account' ? accountOpen : false}
          />
        ))}
      </nav>
      <div className="p-4 border-t space-y-2">
        <Link href="/settings">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Logout
        </Button>
      </div>
    </aside>
  );
}

function NavSection({ section, items, pathname, defaultOpen }: { 
  section: string; 
  items: NavigationItem[]; 
  pathname: string | null;
  defaultOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-md">
        <span>{section}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isRouteActive(pathname, item.href)
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}