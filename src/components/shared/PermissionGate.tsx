// Permission Gate component
// Centralized permission checking for UI elements

'use client';

import { ComponentType, ReactNode } from 'react';
import { Lock, Crown, Shield, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Capability, CapabilityCheckResult } from '@/domain/permissions/types';

export interface PermissionGateProps {
  capability: Capability;
  actor: {
    id: string;
    rank?: number;
    role?: string;
    isSuspended?: boolean;
  };
  resource?: {
    ownerId?: string;
    visibility?: string;
  };
  checkResult?: CapabilityCheckResult;
  children: ReactNode;
  fallback?: ReactNode;
  showLockInfo?: boolean;
}

type UnlockRequirement = {
  type: 'rank' | 'premium' | 'verification' | 'permission';
  description: string;
  icon?: ComponentType<{ className?: string }>;
  currentValue?: number;
  requiredValue?: number;
};

const getUnlockRequirement = (checkResult?: CapabilityCheckResult): UnlockRequirement | null => {
  if (!checkResult?.unlockRequirement) return null;

  const req = checkResult.unlockRequirement;
  if (req.includes('Rank')) {
    const match = req.match(/Rank (\d+)/);
    const requiredRank = match ? parseInt(match[1]) : 5;
    return {
      type: 'rank',
      description: `Reach Rank ${requiredRank}`,
      icon: TrendingUp,
      currentValue: 3, // This should come from actor
      requiredValue: requiredRank,
    };
  }
  
  if (req.includes('Premium')) {
    return {
      type: 'premium',
      description: 'Premium subscription required',
      icon: Crown,
    };
  }
  
  if (req.includes('verified')) {
    return {
      type: 'verification',
      description: 'Account verification required',
      icon: Shield,
    };
  }

  if (req.includes('permission')) {
    return {
      type: 'permission',
      description: 'Insufficient permissions',
      icon: Lock,
    };
  }

  return null;
};

const UnlockInfo = ({ requirement, unlockCost }: { requirement: UnlockRequirement; unlockCost?: number }) => {
  const Icon = requirement.icon || Lock;

  return (
    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="p-2 bg-muted rounded-full">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{requirement.description}</p>
        {requirement.type === 'rank' && requirement.currentValue !== undefined && requirement.requiredValue !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Current: {requirement.currentValue} → Required: {requirement.requiredValue}
          </p>
        )}
        {unlockCost && (
          <p className="text-xs text-muted-foreground mt-1">
            Cost: {unlockCost} Tokens
          </p>
        )}
      </div>
      <Badge variant="outline" className="capitalize">
        {requirement.type}
      </Badge>
    </div>
  );
};

export function PermissionGate({
  capability,
  actor,
  resource,
  checkResult,
  children,
  fallback,
  showLockInfo = false,
}: PermissionGateProps) {
  // In a real implementation, this would call the permission resolver
  // For now, we'll use a basic check
  const isAllowed = checkResult?.allowed ?? true;
  const isOwner = resource?.ownerId === actor.id;
  const isSuspended = actor.isSuspended ?? false;

  if (isSuspended) {
    const suspendedFallback = fallback || (
      <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
        <Shield className="h-5 w-5 text-destructive" />
        <div>
          <p className="font-medium text-sm">Account Suspended</p>
          <p className="text-xs text-muted-foreground">Your account is currently suspended</p>
        </div>
      </div>
    );
    return <>{suspendedFallback}</>;
  }

  if (!isAllowed && !isOwner) {
    const requirement = getUnlockRequirement(checkResult);
    
    if (showLockInfo && requirement) {
      return (
        <div className="space-y-3">
          <UnlockInfo requirement={requirement} unlockCost={checkResult?.unlockCost} />
        </div>
      );
    }

    const defaultFallback = (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span className="text-sm">You don't have permission to access this</span>
      </div>
    );

    return <>{fallback || defaultFallback}</>;
  }

  return <>{children}</>;
}

// Feature Lock component for locked features
export interface FeatureLockProps {
  featureName: string;
  unlockRequirement: UnlockRequirement;
  unlockCost?: number;
  children: ReactNode;
  variant?: 'inline' | 'card' | 'banner';
}

export function FeatureLock({
  featureName,
  unlockRequirement,
  unlockCost,
  children,
  variant = 'card',
}: FeatureLockProps) {
  const Icon = unlockRequirement.icon || Lock;

  if (variant === 'inline') {
    return (
      <div className="relative group">
        <div className="opacity-50 blur-sm grayscale group-hover:blur-none group-hover:grayscale-0 group-hover:opacity-100 transition-all">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="text-center p-4">
            <Icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium">{featureName}</p>
            <p className="text-sm text-muted-foreground mt-1">{unlockRequirement.description}</p>
            {unlockCost && (
              <Button variant="outline" size="sm" className="mt-3">
                Unlock ({unlockCost} Tokens)
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-sm">{featureName} is locked</p>
            <p className="text-xs text-muted-foreground mt-1">{unlockRequirement.description}</p>
          </div>
          {unlockCost && (
            <Button variant="outline" size="sm">
              Unlock ({unlockCost} Tokens)
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
      <Icon className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
      <p className="font-semibold mb-2">{featureName}</p>
      <p className="text-sm text-muted-foreground mb-4">{unlockRequirement.description}</p>
      {unlockCost && (
        <Button variant="outline">
          Unlock ({unlockCost} Tokens)
        </Button>
      )}
    </div>
  );
}