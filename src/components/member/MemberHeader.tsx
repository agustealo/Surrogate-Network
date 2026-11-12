'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeartHandshake, Trophy, User } from 'lucide-react';
import { createClient } from '@/infrastructure/supabase/browser';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BRAND_NAME } from '@/lib/brand';
import { routes } from '@/lib/routes';
import { toast } from '@/hooks/use-toast';

type HeaderIdentity = { name: string; email: string; avatarUrl?: string };

export function MemberHeader() {
  const router = useRouter();
  const [identity, setIdentity] = useState<HeaderIdentity | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('name,email,avatar_url')
        .eq('id', user.id)
        .single();

      if (active && profile) {
        setIdentity({
          name: profile.name,
          email: profile.email,
          avatarUrl: profile.avatar_url ?? undefined,
        });
      }
    })();

    return () => { active = false; };
  }, []);

  async function logout() {
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      router.replace(routes.public.login);
      router.refresh();
    } catch {
      toast({
        variant: 'destructive',
        title: 'Sign out failed',
        description: 'Your session may still be active. Please try again.',
      });
    }
  }

  const initials = identity?.name?.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'SN';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={routes.member.home} className="flex items-center gap-2">
          <HeartHandshake className="h-6 w-6 text-primary" />
          <span className="font-bold">{BRAND_NAME}</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Open account menu">
              <Avatar className="h-8 w-8">
                {identity?.avatarUrl && <AvatarImage src={identity.avatarUrl} alt={identity.name} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{identity?.name ?? 'Account'}</p>
              <p className="text-xs text-muted-foreground">{identity?.email ?? ''}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={routes.member.profile} className="cursor-pointer"><User className="mr-2 h-4 w-4" />Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={routes.member.rewards} className="cursor-pointer"><Trophy className="mr-2 h-4 w-4" />Rewards & Progress</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={routes.member.settings} className="cursor-pointer">Settings</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onSelect={() => void logout()}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
