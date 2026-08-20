'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, MessageSquare, Target, 
  Briefcase, Heart, Shield, FileText, Coins, 
  Trophy, Clock, Settings, AlertCircle, ChevronDown, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/routes';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from 'react';

type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: React.ElementType;
  description?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navigation: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', href: routes.admin.dashboard, label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Members',
    items: [
      { id: 'members', href: routes.admin.members, label: 'All Members', icon: Users },
    ]
  },
  {
    title: 'Relationships',
    items: [
      { id: 'needs', href: routes.admin.needs, label: 'Needs', icon: Heart },
      { id: 'offers', href: routes.admin.offers, label: 'Offers', icon: Briefcase },
      { id: 'proposals', href: '/admin/proposals', label: 'Proposals', icon: MessageSquare },
      { id: 'surrogacies', href: routes.admin.surrogacies, label: 'Surrogacies', icon: Target },
      { id: 'moments', href: '/admin/moments', label: 'Moments', icon: Clock },
      { id: 'exchanges', href: '/admin/exchanges', label: 'Exchanges', icon: Coins },
      { id: 'feedback', href: routes.admin.feedback, label: 'Feedback', icon: MessageSquare },
    ]
  },
  {
    title: 'Trust & Safety',
    items: [
      { id: 'reports', href: routes.admin.reports, label: 'Reports', icon: AlertCircle },
      { id: 'moderation', href: routes.admin.moderation, label: 'Moderation Queue', icon: Shield },
      { id: 'media', href: routes.admin.media, label: 'Media Review', icon: FileText },
    ]
  },
  {
    title: 'Economy',
    items: [
      { id: 'tokens', href: routes.admin.tokens, label: 'Token Ledger', icon: Coins },
      { id: 'ledger', href: routes.admin.ledger, label: 'Adjustments', icon: FileText },
    ]
  },
  {
    title: 'Progression',
    items: [
      { id: 'ranks', href: routes.admin.ranks, label: 'Ranks', icon: Trophy },
      { id: 'xp', href: routes.admin.xp, label: 'XP', icon: Clock },
    ]
  },
  {
    title: 'System',
    items: [
      { id: 'audit', href: routes.admin.audit, label: 'Audit Log', icon: FileText },
      { id: 'settings', href: routes.admin.settings, label: 'Settings', icon: Settings },
    ]
  },
];

function AdminNavSection({ section }: { section: NavSection }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(() => {
    return section.items.some(item => 
      pathname === item.href || pathname?.startsWith(item.href + '/')
    );
  });

  return (
    <div className="space-y-1">
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
          {section.items.map(item => (
            <NavItemLink key={item.id} item={item} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function NavItemLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function AdminNavigation() {
  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <div className="p-4 border-b">
        <h2 className="text-sm font-semibold text-muted-foreground">Admin Console</h2>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navigation.map((section) => (
          <AdminNavSection key={section.title} section={section} />
        ))}
      </nav>
    </aside>
  );
}