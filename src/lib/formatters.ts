// Shared formatting utilities
// Centralized to prevent duplicate formatting logic across the app

import { formatDistanceToNow, format } from 'date-fns';

// Date formatting
export const formatDate = (date: string | Date, formatStr: string = 'PPP'): string => {
  const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return format(dateObj, formatStr);
};

export const formatRelativeTime = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

export const formatScheduleTime = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d, yyyy • h:mm a');
};

export const formatShortDate = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d');
};

// Rating formatting
export const formatRating = (rating?: number, reviewCount?: number): string => {
  if (typeof rating !== 'number') return 'Not rated yet';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let stars = '★'.repeat(fullStars);
  if (hasHalfStar) stars += '½';
  stars += '☆'.repeat(emptyStars);
  
  if (typeof reviewCount === 'number' && reviewCount > 0) {
    return `${stars} (${reviewCount})`;
  }
  return stars;
};

export const formatRatingStars = (rating?: number): number[] => {
  if (typeof rating !== 'number') return [];
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars.push(1); // Full star
    } else if (i - 0.5 <= rating) {
      stars.push(0.5); // Half star
    } else {
      stars.push(0); // Empty star
    }
  }
  return stars;
};

// Token formatting
export const formatTokenAmount = (amount: number): string => {
  return amount.toLocaleString();
};

export const formatTokenBalance = (balance: number): string => {
  return `${formatTokenAmount(balance)} Tokens`;
};

// XP formatting
export const formatXP = (amount: number): string => {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k XP`;
  }
  return `${amount.toLocaleString()} XP`;
};

export const formatXPProgress = (current: number, max: number): string => {
  const percentage = ((current / max) * 100).toFixed(1);
  return `${formatXP(current)} / ${formatXP(max)} (${percentage}%)`;
};

// Rank formatting
export const formatRank = (rank: number, title?: string): string => {
  return title ? `Rank ${rank} - ${title}` : `Rank ${rank}`;
};

// Compatibility formatting
export const formatCompatibility = (compatibility: number): string => {
  return `${Math.round(compatibility)}%`;
};

export const getCompatibilityColor = (compatibility: number): string => {
  if (compatibility >= 90) return 'text-green-600';
  if (compatibility >= 75) return 'text-blue-600';
  if (compatibility >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

// Status formatting
export const formatStatus = (status: string): string => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Text truncation
export const truncateText = (text: string, maxLength: number, suffix = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

// Number formatting
export const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
  return num.toLocaleString(undefined, options);
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};