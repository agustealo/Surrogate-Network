// Profile about component
// Displays profile bio and basic information

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/formatters';

interface ProfileAboutProps {
  bio: string;
  location?: string;
  joinedDate?: string;
  className?: string;
}

export function ProfileAbout({ bio, location, joinedDate, className }: ProfileAboutProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-primary" />
          About Me
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
            {bio}
          </p>
        </div>

        {(location || joinedDate) && (
          <div className="pt-4 border-t space-y-2 text-sm">
            {location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            )}
            {joinedDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Joined {formatRelativeTime(joinedDate)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}