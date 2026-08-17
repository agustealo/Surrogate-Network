// Profile media component
// Handles media display with blur states and access control

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Lock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

type MediaVisibility = 'visible' | 'blurred' | 'private' | 'requestable' | 'request_pending' | 'granted' | 'expired';

interface ProfileMediaProps {
  avatarUrl?: string;
  userName: string;
  visibility?: MediaVisibility;
  onRequestAccess?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ProfileMedia({ 
  avatarUrl, 
  userName, 
  visibility = 'visible', 
  onRequestAccess,
  size = 'lg' 
}: ProfileMediaProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-28 w-28',
    xl: 'h-32 w-32',
  };

  const isBlurred = ['blurred', 'private', 'requestable', 'request_pending'].includes(visibility);
  const showRequestButton = visibility === 'requestable';

  return (
    <div className="relative">
      <Avatar className={cn(sizeClasses[size], 'border-4 border-background bg-background shadow-lg')}>
        {isBlurred && (
          <div className="absolute inset-0 bg-gradient-to-br from-muted/80 to-muted/60 backdrop-blur-sm flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <AvatarImage 
          src={avatarUrl} 
          alt={userName} 
          className={cn(isBlurred && 'blur-md')}
        />
        <AvatarFallback className={cn(sizeClasses[size], 'flex items-center justify-center')}>
          {userName.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Screen reader announcement for accessibility */}
      {isBlurred && (
        <span className="sr-only">
          Private profile image. {visibility === 'requestable' ? 'Access can be requested.' : 'Access not granted.'}
        </span>
      )}

      {/* Request access button */}
      {showRequestButton && onRequestAccess && (
        <Button
          size="sm"
          variant="outline"
          className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0 bg-background shadow-lg"
          onClick={onRequestAccess}
          aria-label="Request access to view this image"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}