// Profile actions component
// Context-aware actions based on viewer permissions and relationship state

'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle, Share2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ProfileActionsProps {
  profileId: string;
  canMessage?: boolean;
  onMessage?: () => void;
  onShare?: () => void;
  showMoreOptions?: boolean;
}

export function ProfileActions({ 
  profileId, 
  canMessage = true, 
  onMessage,
  onShare,
  showMoreOptions = true 
}: ProfileActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Primary actions */}
      {canMessage && (
        <Button 
          onClick={onMessage}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Message
        </Button>
      )}

      {onShare && (
        <Button variant="outline" onClick={onShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      )}

      {/* More options dropdown */}
      {showMoreOptions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Profile Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              View Full Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              Report Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              Block Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Copy Profile Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}