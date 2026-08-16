
import Link from 'next/link';
import {
  HeartHandshake,
  Home,
  UserPlus,
  Sparkles,
  UsersRound,
  LogIn,
  Settings,
  MessageSquareText,
  UserCircle, 
  UserCog, 
  Network,
  LayoutDashboard,
  BookHeart, // Added for Principles
  Coins, // Added for Tokens
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppHeader() {
  const mockTokenBalance = 25; // Mock data for user's token balance

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Network className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            Surrogate Network
          </h1>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Main Navigation Buttons */}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard" className="flex items-center gap-1">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </Button>
           <Button variant="ghost" size="sm" asChild>
            <Link href="/matches" className="flex items-center gap-1">
              <UsersRound className="h-4 w-4" />
              <span className="hidden sm:inline">Surrogacy</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/chat" className="flex items-center gap-1">
              <MessageSquareText className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </Link>
          </Button>
           <Button variant="ghost" size="sm" asChild>
            <Link href="/principles" className="flex items-center gap-1">
              <BookHeart className="h-4 w-4" />
              <span className="hidden sm:inline">Principles</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/needs/create" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Need</span>
            </Link>
          </Button>
         
          {/* Token Wallet Display */}
          <div className="flex items-center gap-2 border-l pl-2 sm:pl-4 ml-1 sm:ml-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold text-sm text-foreground">{mockTokenBalance} Tokens</span>
          </div>

          {/* User Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <UserCircle className="h-5 w-5" />
                <span className="sr-only">Open user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/profile/create" className="flex items-center gap-2 w-full cursor-pointer">
                  <UserCog className="h-4 w-4" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 w-full cursor-pointer">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/login" className="flex items-center gap-2 w-full cursor-pointer">
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/signup" className="flex items-center gap-2 w-full cursor-pointer">
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
