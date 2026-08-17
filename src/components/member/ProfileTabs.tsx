// Profile tabs component
// Organized navigation between different profile sections

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface ProfileTab {
  value: string;
  label: string;
  icon?: React.ElementType;
  disabled?: boolean;
  count?: number;
}

interface ProfileTabsProps {
  tabs: ProfileTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export function ProfileTabs({ tabs, activeTab, onTabChange, children }: ProfileTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value}
              disabled={tab.disabled}
              className="flex items-center gap-2"
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-auto bg-muted px-1.5 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {children}
    </Tabs>
  );
}