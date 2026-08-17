// Status badge components
// Centralized status display logic

'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

type StatusConfig = {
  variant: StatusVariant;
  icon?: string;
  label: string;
};

const getStatusConfig = (status: string): StatusConfig => {
  const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '-');
  
  const statusMap: Record<string, StatusConfig> = {
    // General statuses
    active: { variant: 'success', label: 'Active' },
    pending: { variant: 'warning', label: 'Pending' },
    completed: { variant: 'success', label: 'Completed' },
    in_progress: { variant: 'info', label: 'In Progress' },
    cancelled: { variant: 'neutral', label: 'Cancelled' },
    paused: { variant: 'warning', label: 'Paused' },
    expired: { variant: 'error', label: 'Expired' },
    failed: { variant: 'error', label: 'Failed' },
    success: { variant: 'success', label: 'Success' },
    error: { variant: 'error', label: 'Error' },
    
    // Proposal statuses
    accepted: { variant: 'success', label: 'Accepted' },
    declined: { variant: 'error', label: 'Declined' },
    countered: { variant: 'warning', label: 'Countered' },
    withdrawn: { variant: 'neutral', label: 'Withdrawn' },
    
    // Surrogacy statuses  
    archived: { variant: 'neutral', label: 'Archived' },
    ended: { variant: 'neutral', label: 'Ended' },
    
    // Message statuses
    sent: { variant: 'neutral', label: 'Sent' },
    delivered: { variant: 'info', label: 'Delivered' },
    read: { variant: 'success', label: 'Read' },
    
    // Content moderation statuses
    approved: { variant: 'success', label: 'Approved' },
    rejected: { variant: 'error', label: 'Rejected' },
    flagged: { variant: 'error', label: 'Flagged' },
    under_review: { variant: 'warning', label: 'Under Review' },
    
    // Media states
    visible: { variant: 'success', label: 'Visible' },
    blurred: { variant: 'warning', label: 'Blurred' },
    private: { variant: 'error', label: 'Private' },
    requestable: { variant: 'info', label: 'Requestable' },
    request_pending: { variant: 'warning', label: 'Request Pending' },
    granted: { variant: 'success', label: 'Granted' },
    
    // Verification statuses
    unverified: { variant: 'neutral', label: 'Unverified' },
    email_verified: { variant: 'success', label: 'Email Verified' },
    phone_verified: { variant: 'success', label: 'Phone Verified' },
    photo_verified: { variant: 'success', label: 'Photo Verified' },
    identity_verified: { variant: 'success', label: 'Identity Verified' },
    fully_verified: { variant: 'success', label: 'Fully Verified' },
    
    // Account states
    suspended: { variant: 'error', label: 'Suspended' },
    restricted: { variant: 'warning', label: 'Restricted' },
    onboarding_incomplete: { variant: 'info', label: 'Setup Required' },
  };
  
  return statusMap[normalizedStatus] || { 
    variant: 'neutral', 
    label: status.replace(/[_\s]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  };
};

const getVariantStyles = (variant: StatusVariant) => {
  const styles = {
    default: '',
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return styles[variant];
};

interface StatusBadgeProps {
  status: string;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, className, showLabel = true, size = 'md' }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const variantStyles = getVariantStyles(config.variant);
  
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-normal capitalize",
        variantStyles,
        sizeStyles[size],
        className
      )}
    >
      {showLabel && config.label}
    </Badge>
  );
}

// Compact status dot indicator
interface StatusDotProps {
  status: string;
  className?: string;
  showLabel?: boolean;
}

export function StatusDot({ status, className, showLabel = false }: StatusDotProps) {
  const config = getStatusConfig(status);
  
  const colorMap = {
    default: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    neutral: 'bg-gray-400',
  };
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("h-2 w-2 rounded-full", colorMap[config.variant])} />
      {showLabel && <span className="text-xs text-muted-foreground">{config.label}</span>}
    </div>
  );
}

// Status chip with icon support
interface StatusChipProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export function StatusChip({ status, className, showIcon = false }: StatusChipProps) {
  const config = getStatusConfig(status);
  const variantStyles = getVariantStyles(config.variant);
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
      variantStyles,
      className
    )}>
      {showIcon && (
        <div className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      )}
      {config.label}
    </div>
  );
}

// Get status color for non-badge usage
export function getStatusColor(status: string): string {
  const config = getStatusConfig(status);
  const colorMap = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600',
    neutral: 'text-gray-500',
  };
  return colorMap[config.variant];
}

// Get background color for status
export function getStatusBgColor(status: string): string {
  const config = getStatusConfig(status);
  const colorMap = {
    default: 'bg-gray-100',
    success: 'bg-green-100',
    warning: 'bg-yellow-100',
    error: 'bg-red-100',
    info: 'bg-blue-100',
    neutral: 'bg-gray-50',
  };
  return colorMap[config.variant];
}