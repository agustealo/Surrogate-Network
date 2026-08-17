// Shared error state components
// Reusable error handling patterns across the app

'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  showIcon?: boolean;
  variant?: 'inline' | 'card' | 'alert';
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  showIcon = true,
  variant = 'inline',
  className,
}: ErrorStateProps) {
  if (variant === 'alert') {
    return (
      <Alert variant="destructive" className={className}>
        {showIcon && <AlertCircle className="h-4 w-4" />}
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{message}</span>
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {retryLabel}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={cn("border-destructive/50", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            {showIcon && <AlertCircle className="h-5 w-5" />}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{message}</p>
          {onRetry && (
            <Button
              variant="outline"
              onClick={onRetry}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {retryLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {showIcon && (
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
      )}
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

// Specialized error states
interface PermissionDeniedProps {
  message?: string;
  onReturn?: () => void;
}

export function PermissionDenied({ 
  message = "You don't have permission to access this resource",
  onReturn 
}: PermissionDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-orange-600" />
      </div>
      <h3 className="font-semibold mb-2">Access Denied</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{message}</p>
      {onReturn && (
        <Button variant="outline" onClick={onReturn}>
          Go Back
        </Button>
      )}
    </div>
  );
}

interface NotFoundProps {
  resource?: string;
  onReturn?: () => void;
}

export function NotFound({ resource = 'resource', onReturn }: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2">Not Found</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        The {resource} you're looking for doesn't exist or may have been removed.
      </p>
      {onReturn && (
        <Button variant="outline" onClick={onReturn}>
          Go Back
        </Button>
      )}
    </div>
  );
}

interface NetworkErrorProps {
  onRetry?: () => void;
}

export function NetworkError({ onRetry }: NetworkErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-orange-600" />
      </div>
      <h3 className="font-semibold mb-2">Connection Error</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        We couldn't connect to the server. Please check your internet connection and try again.
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}