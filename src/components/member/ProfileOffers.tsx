// Profile offers component
// Displays and manages profile offerings with proper interactions

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Star, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatRating, formatTokenAmount } from '@/lib/formatters';
import type { LegacyOffering, Offering } from '@/domain/types';

interface ProfileOffersProps {
  offerings: Offering[];
  onPitchOffer?: (offering: Offering) => void;
  className?: string;
}

function OfferDetailModal({ offering, onClose }: { offering: Offering; onClose: () => void }) {
  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="text-primary h-6 w-6" />
          {offering.title}
        </DialogTitle>
        <div className="pt-1 flex justify-between items-center">
          <Badge variant="outline" className="text-xs capitalize bg-purple-100 text-purple-700 border-purple-200">
            {offering.category}
          </Badge>
          {offering.tokenReward && (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
              <span>Reward:</span> <span>+{formatTokenAmount(offering.tokenReward)} Tokens</span>
            </div>
          )}
        </div>
        <DialogDescription className="pt-3 text-left text-base text-muted-foreground leading-relaxed">
          {offering.description}
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4 space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-1.5">Rating & Reviews</h4>
          <div className="flex items-center gap-2">
            {formatRating(offering.averageRating, offering.ratingCount)}
          </div>
          {(!offering.averageRating && !offering.ratingCount) && (
            <p className="text-xs text-muted-foreground mt-1">No ratings yet for this offering</p>
          )}
        </div>
      </div>
      
      <DialogFooter className="mt-2">
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function OfferCard({ offering, onPitchOffer, onViewDetails }: { 
  offering: Offering; 
  onPitchOffer?: (offering: Offering) => void;
  onViewDetails?: (offering: Offering) => void;
}) {
  return (
    <Card className="border-l-4 border-l-purple-600 hover:shadow-md transition-all">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-purple-700">{offering.title}</h3>
              <div className="mt-1.5">
                <Badge variant="outline" className="text-xs capitalize bg-purple-100 text-purple-700 border-purple-200">
                  {offering.category}
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {formatRating(offering.averageRating, offering.ratingCount)}
              </div>
            </div>
            {offering.tokenReward && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                <span>+{formatTokenAmount(offering.tokenReward)}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{offering.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfileOffers({ offerings, onPitchOffer, className }: ProfileOffersProps) {
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null);

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="text-primary h-5 w-5" />
            What I Offer
            {offerings.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {offerings.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {offerings.length > 0 ? (
            offerings.map((offering) => (
              <OfferCard
                key={offering.id}
                offering={offering}
                onPitchOffer={onPitchOffer}
                onViewDetails={setSelectedOffering}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic p-4">
              Details about what I offer are being curated.
            </p>
          )}
        </CardContent>
      </Card>

      {selectedOffering && (
        <OfferDetailModal 
          offering={selectedOffering} 
          onClose={() => setSelectedOffering(null)} 
        />
      )}
    </>
  );
}