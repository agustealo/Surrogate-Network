'use client';

import { Shield, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-destructive/5 backdrop-blur supports-[backdrop-filter]:bg-destructive/5">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search members, reports, content..." 
              className="pl-9 w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <LayoutDashboard className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}