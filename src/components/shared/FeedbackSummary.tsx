// Feedback Summary component
// Centralized feedback display logic

'use client';

import { Star, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatRating, formatNumber } from '@/lib/utils';

export interface FeedbackSummaryProps {
  rating?: number;
  reviewCount?: number;
  showRating?: boolean;
  showCount?: boolean;
  showBreakdown?: boolean;
  breakdown?: {
    reliability: number;
    communication: number;
    boundaryRespect: number;
    consideration: number;
    followThrough: number;
  };
  recentFeedbackCount?: number;
  compact?: boolean;
  variant?: 'default' | 'card' | 'inline';
}

const RatingDisplay = ({ rating, reviewCount, compact }: { rating?: number; reviewCount?: number; compact?: boolean }) => {
  if (typeof rating !== 'number') {
    return <span className="text-xs text-muted-foreground">Not rated yet</span>;
  }

  const fullStars = Math.floor(rating);
  const emptyStars = 5 - fullStars;

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className={cn("fill-yellow-400 text-yellow-400", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
      ))}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className={cn("text-muted-foreground/50", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
      ))}
      {reviewCount && reviewCount > 0 && (
        <span className={cn("text-muted-foreground ml-1.5", compact ? "text-xs" : "text-sm")}>
          ({formatNumber(reviewCount)})
        </span>
      )}
    </div>
  );
};

const RatingBreakdown = ({ breakdown, compact }: { breakdown: FeedbackSummaryProps['breakdown']; compact?: boolean }) => {
  if (!breakdown) return null;

  const dimensions = [
    { key: 'reliability', label: 'Reliability' },
    { key: 'communication', label: 'Communication' },
    { key: 'boundaryRespect', label: 'Boundary Respect' },
    { key: 'consideration', label: 'Consideration' },
    { key: 'followThrough', label: 'Follow-through' },
  ] as const;

  return (
    <div className="space-y-2">
      {dimensions.map((dim) => {
        const score = breakdown?.[dim.key];
        if (typeof score !== 'number') return null;
        
        return (
          <div key={dim.key} className="flex items-center gap-2">
            <span className={cn("text-xs min-w-[100px]", compact ? "text-[10px]" : "text-sm")}>{dim.label}</span>
            <div className="flex-1">
              <Progress value={score * 20} className="h-1.5" />
            </div>
            <span className={cn("text-xs font-medium min-w-[30px] text-right", compact ? "text-[10px]" : "text-sm")}>
              {score.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export function FeedbackSummary({
  rating,
  reviewCount,
  showRating = true,
  showCount = true,
  showBreakdown = false,
  breakdown,
  recentFeedbackCount,
  compact = false,
  variant = 'default',
}: FeedbackSummaryProps) {
  const hasData = typeof rating === 'number' || (reviewCount && reviewCount > 0);

  if (!hasData) {
    return (
      <div className={cn(
        "text-center text-muted-foreground",
        compact ? "text-xs" : "text-sm"
      )}>
        No feedback yet
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Feedback Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showRating && (
            <div className="flex items-center gap-2">
              <RatingDisplay rating={rating} reviewCount={reviewCount} compact={compact} />
              {rating && rating >= 4.5 && (
                <Badge variant="secondary" className="text-xs">Top Rated</Badge>
              )}
            </div>
          )}
          
          {showBreakdown && breakdown && (
            <RatingBreakdown breakdown={breakdown} compact={compact} />
          )}

          {recentFeedbackCount && recentFeedbackCount > 0 && (
            <div className="text-xs text-muted-foreground">
              {formatNumber(recentFeedbackCount)} recent reviews
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        {showRating && <RatingDisplay rating={rating} reviewCount={showCount ? reviewCount : undefined} compact={compact} />}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showRating && (
        <div className="flex items-center gap-2">
          <RatingDisplay rating={rating} reviewCount={showCount ? reviewCount : undefined} compact={compact} />
        </div>
      )}
      
      {showBreakdown && breakdown && (
        <div className="pt-2 border-t">
          <RatingBreakdown breakdown={breakdown} compact={compact} />
        </div>
      )}

      {recentFeedbackCount && recentFeedbackCount > 0 && (
        <div className="text-xs text-muted-foreground pt-2 border-t">
          {formatNumber(recentFeedbackCount)} recent reviews
        </div>
      )}
    </div>
  );
}

// Rating Breakdown component for detailed view
export interface RatingBreakdownProps {
  rating?: number;
  reviewCount?: number;
  breakdown?: {
    reliability: number;
    communication: number;
    boundaryRespect: number;
    consideration: number;
    followThrough: number;
  };
  showDetails?: boolean;
}

export function RatingBreakdown({ rating, reviewCount, breakdown, showDetails = true }: RatingBreakdownProps) {
  const hasData = typeof rating === 'number' || (reviewCount && reviewCount > 0);

  if (!hasData) {
    return (
      <div className="text-center text-muted-foreground text-sm py-4">
        No ratings available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {typeof rating === 'number' && (
        <div className="text-center">
          <div className="text-3xl font-bold mb-1">{rating.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">
            {formatNumber(reviewCount || 0)} {reviewCount === 1 ? 'rating' : 'ratings'}
          </div>
        </div>
      )}

      {showDetails && breakdown && (
        <RatingBreakdown breakdown={breakdown} />
      )}
    </div>
  );
}