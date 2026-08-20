'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, MessageSquare, Target, 
  Briefcase, Heart, Shield, FileText, Coins, 
  Trophy, Clock, Settings, AlertCircle, ChevronDown, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  adminNavigation,
  filterNavigationItems,
  groupNavigationBySection,
  isRouteActive,
} from '@/navigation';
import type { NavigationItem } from '@/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from 'react';

const ICON_MAP: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  members: Users,
  needs: Heart,
  offers: Briefcase,
  proposals: MessageSquare,
  surrogacies: Target,
  moments: Clock,
  exchanges: Coins,
  feedback: MessageSquare,
  reports: AlertCircle,
  moderation: Shield,
  media: FileText,
  tokens: Coins,
  ledger: FileText,
  ranks: Trophy,
  xp: Clock,
  audit: FileText,
  settings: Settings,
};

function AdminNavSection({ section, items, pathname }: { 
  section: string; 
  items: NavigationItem[];
  pathname: string | null;
}) {
  const [isOpen, setIsOpen] = useState(() => {
    return items.some(item => isRouteActive(pathname, item.href));
  });

  return (
    <div className="space-y-1">
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
            const Icon = item.icon || ICON_MAP[item.id] || FileText;
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
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function AdminNavigation() {
  const pathname = usePathname();
  const adminItems = filterNavigationItems(adminNavigation, 'admin', 'desktop');
  const grouped = groupNavigationBySection(adminItems as NavigationItem[]);

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <div className="p-4 border-b">
        <h2 className="text-sm font-semibold text-muted-foreground">Admin Console</h2>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {Object.entries(grouped).map(([section, items]) => (
          <AdminNavSection 
            key={section} 
            section={section} 
            items={items} 
            pathname={pathname}
          />
        ))}
      </nav>
    </aside>
  );
}