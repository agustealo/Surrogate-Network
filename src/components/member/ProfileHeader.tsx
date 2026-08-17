// Profile header component
// Displays profile identity, media, and primary actions

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, UserCircle, Link as LinkIcon, Video } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/types';
import { formatRelativeTime } from '@/lib/formatters';

interface ProfileHeaderProps {
  profile: Profile;
  currentUserCanMessage?: boolean;
  onSendMessage?: () => void;
}

export function ProfileHeader({ profile, currentUserCanMessage = true, onSendMessage }: ProfileHeaderProps) {
  const hasPortfolio = !!profile.portfolioUrl;
  const hasVideoIntro = !!profile.videoIntroUrl;

  return (
    <div className="space-y-6">
      {/* Cover Image Section */}
      <div className="relative h-40 md:h-48 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/20 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-muted/10" />
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
          <UserCircle className="h-16 w-16" />
        </div>
      </div>

      {/* Avatar Section */}
      <div className="flex justify-center -mt-16 relative z-10">
        <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-background bg-background shadow-lg">
          <AvatarImage src={profile.avatarUrl} alt={profile.name} />
          <AvatarFallback className="text-3xl md:text-4xl">
            {profile.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Identity Section */}
      <div className="text-center px-4">
        <h1 className="text-2xl md:text-3xl font-bold">{profile.name}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Exploring connections on Surrogate Companion
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Joined {formatRelativeTime(profile.createdAt)}
        </p>
      </div>

      {/* External Links */}
      {(hasPortfolio || hasVideoIntro) && (
        <div className="flex justify-center gap-2 px-4">
          {hasPortfolio && (
            <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none max-w-[200px]">
              <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="truncate">
                <LinkIcon className="mr-2 h-4 w-4" />
                My Story/Portfolio
              </a>
            </Button>
          )}
          {hasVideoIntro && (
            <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none max-w-[200px]">
              <a href={profile.videoIntroUrl} target="_blank" rel="noopener noreferrer" className="truncate">
                <Video className="mr-2 h-4 w-4" />
                Hear My Voice
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-2 px-4">
        {currentUserCanMessage && (
          <Button 
            size="lg" 
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={onSendMessage}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Message {profile.name.split(' ')[0]}
          </Button>
        )}
      </div>
    </div>
  );
}