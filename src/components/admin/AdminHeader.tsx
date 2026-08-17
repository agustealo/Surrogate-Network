'use client';

import { Shield, AlertTriangle, LayoutDashboard, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-destructive/5 backdrop-blur supports-[backdrop-filter]:bg-destructive/5">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-destructive" />
            <h1 className="text-lg font-bold text-foreground">Admin Console</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-2 ml-4">
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Development
            </Badge>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
              Super Admin
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search members, reports, content..." 
              className="pl-9 w-64"
            />
          </div>

          <Select defaultValue="all-time">
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>

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