'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeartHandshake, Bell, Search, User, Coins } from 'lucide-react';
import { createClient } from '@/infrastructure/supabase/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type HeaderIdentity = { name: string; email: string; avatarUrl?: string; tokenBalance: number; notificationCount: number };

export function MemberHeader() {
  const router = useRouter();
  const [identity, setIdentity] = useState<HeaderIdentity | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from('profiles').select('name,email,avatar_url,token_balance').eq('id', user.id).single(),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false),
      ]);
      if (active && profile) setIdentity({ name: profile.name, email: profile.email, avatarUrl: profile.avatar_url ?? undefined, tokenBalance: profile.token_balance ?? 0, notificationCount: count ?? 0 });
    })();
    return () => { active = false; };
  }, []);

  async function logout() {
    await createClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  const initials = identity?.name?.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'SN';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex items-center gap-2"><HeartHandshake className="h-6 w-6 text-primary" /><span className="hidden font-bold sm:inline">Surrogate Network</span></Link>
          <div className="relative hidden lg:flex"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search" placeholder="Search needs and offers" className="w-64 pl-9" /></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications"><Bell className="h-5 w-5" />{(identity?.notificationCount ?? 0) > 0 && <Badge variant="destructive" className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs">{identity!.notificationCount}</Badge>}</Button>
          <div className="hidden items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5 sm:flex"><Coins className="h-4 w-4" /><span className="text-sm font-medium">{identity?.tokenBalance ?? 0}</span></div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><Avatar className="h-8 w-8">{identity?.avatarUrl && <AvatarImage src={identity.avatarUrl} alt={identity.name} />}<AvatarFallback>{initials}</AvatarFallback></Avatar></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel><p className="text-sm font-medium">{identity?.name ?? 'Account'}</p><p className="text-xs text-muted-foreground">{identity?.email ?? ''}</p></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/profile" className="cursor-pointer"><User className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/settings" className="cursor-pointer">Settings</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onSelect={() => void logout()}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
