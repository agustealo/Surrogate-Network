'use client';

import { Shield, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><h1 className="text-lg font-bold">Admin Console</h1></div>
        <div className="relative hidden max-w-md lg:flex"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search administration" placeholder="Search administration" className="w-64 pl-9" /></div>
      </div>
    </header>
  );
}
