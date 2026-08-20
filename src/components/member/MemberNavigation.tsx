'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, Search, HeartHandshake, MessageSquare, Award, User, 
  LogOut, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/routes';

const navItems = [
  { href: routes.member.home, label: 'Home', icon: Home },
  { href: routes.member.discover, label: 'Discover', icon: Search },
  { href: routes.member.needs, label: 'Needs', icon: HeartHandshake },
  { href: routes.member.offers, label: 'Offers', icon: HeartHandshake },
  { href: routes.member.surrogacies, label: 'Surrogacies', icon: HeartHandshake },
  { href: routes.member.messages, label: 'Messages', icon: MessageSquare },
  { href: routes.member.rewards, label: 'Rewards', icon: Award },
  { href: routes.member.profile, label: 'Profile', icon: User },
];

export function MemberNavigation() {
  const pathname = usePathname();
  const router = useRouter();

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
        <Link href={routes.member.home} className="flex items-center gap-2">
          <HeartHandshake className="h-6 w-6 text-primary" />
          <span className="font-bold text-foreground">Surrogate Companion</span>
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
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
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t space-y-2">
        <Link href={routes.member.settings}>
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