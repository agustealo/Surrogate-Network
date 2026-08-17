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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from 'react';

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  description?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navigation: (NavItem | NavSection)[] = [
  {
    title: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Members',
    items: [
      { href: '/admin/members', label: 'All Members', icon: Users },
      { href: '/admin/members/verified', label: 'Verified', icon: Shield },
      { href: '/admin/members/suspended', label: 'Suspended', icon: AlertCircle },
    ]
  },
  {
    title: 'Community',
    items: [
      { href: '/admin/needs', label: 'Needs', icon: Heart },
      { href: '/admin/offers', label: 'Offers', icon: Briefcase },
      { href: '/admin/surrogacies', label: 'Surrogacies', icon: Target },
      { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
    ]
  },
  {
    title: 'Trust & Safety',
    items: [
      { href: '/admin/reports', label: 'Reports', icon: AlertCircle },
      { href: '/admin/moderation', label: 'Moderation', icon: Shield },
      { href: '/admin/media', label: 'Media Review', icon: FileText },
    ]
  },
  {
    title: 'Economy',
    items: [
      { href: '/admin/tokens', label: 'Token Management', icon: Coins },
      { href: '/admin/ledger', label: 'Transaction Ledger', icon: FileText },
    ]
  },
  {
    title: 'Progression',
    items: [
      { href: '/admin/ranks', label: 'Rank System', icon: Trophy },
      { href: '/admin/xp', label: 'XP Progression', icon: Clock },
    ]
  },
  {
    title: 'Platform',
    items: [
      { href: '/admin/audit', label: 'Audit Log', icon: FileText },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ]
  },
];

export function AdminNavigation() {
  const pathname = usePathname();

  const renderNavItem = (item: NavItem, depth: number = 0) => {
    const isActive = pathname === item.href;
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
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const renderSection = (section: NavSection) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasActiveRoute = section.items.some(item => pathname === item.href);
    
    return (
      <div key={section.title} className="space-y-1">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-md">
            <span>{section.title}</span>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {section.items.map(item => renderNavItem(item))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <div className="p-4 border-b">
        <h2 className="text-sm font-semibold text-muted-foreground">Admin Console</h2>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navigation.map((section) => 
          'items' in section ? renderSection(section) : renderNavItem(section as NavItem)
        )}
      </nav>
      <div className="p-4 border-t bg-muted/30">
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Environment: <span className="font-medium text-foreground">Development</span></p>
          <p>Role: <span className="font-medium text-foreground">Super Admin</span></p>
        </div>
      </div>
    </aside>
  );
}