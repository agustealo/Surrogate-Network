// Profile needs component
// Displays and manages profile needs with proposal functionality

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatRating } from '@/lib/formatters';
import type { Request as ProfileRequest } from '@/lib/types';

interface ProfileNeedsProps {
  needs: ProfileRequest[];
  onPitchOffer?: (need: ProfileRequest) => void;
  className?: string;
}

export function ProfileNeeds({ needs, onPitchOffer, className }: ProfileNeedsProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coffee className="text-accent h-5 w-5" />
          What I Need
          {needs.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {needs.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {needs.length > 0 ? (
          needs.map((need) => (
            <div key={need.id} className="p-4 border rounded-md shadow-sm bg-card transition-all group">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="font-semibold text-accent">{need.title}</h3>
                  <div className="my-1.5">
                    <Badge variant="outline" className="text-xs capitalize bg-pink-100 text-pink-700 border-pink-200">
                      {need.category}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    {formatRating(need.averageRating, need.ratingCount)}
                  </div>
                </div>
                {onPitchOffer && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onPitchOffer(need)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Pitch an Offer!
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2 truncate">{need.description}</p>
              {need.tags && need.tags.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {need.tags.slice(0, 4).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs px-2 py-1 bg-accent text-accent-foreground border-transparent">
                      {tag}
                    </Badge>
                  ))}
                  {need.tags.length > 4 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-muted/50">
                      +{need.tags.length - 4} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground italic p-4">
            Details about what I seek are being contemplated.
          </p>
        )}
      </CardContent>
    </Card>
  );
}