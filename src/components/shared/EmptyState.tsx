import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      {Icon && (
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {primaryAction && (
          primaryAction.href ? (
            <a
              href={primaryAction.href}
              className="inline-flex items-center justify-center px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {primaryAction.label}
            </a>
          ) : (
            <button
              onClick={primaryAction.onClick}
              className="inline-flex items-center justify-center px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {primaryAction.label}
            </button>
          )
        )}
        
        {secondaryAction && (
          secondaryAction.href ? (
            <a
              href={secondaryAction.href}
              className="inline-flex items-center justify-center px-6 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
            >
              {secondaryAction.label}
            </a>
          ) : (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center justify-center px-6 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
            >
              {secondaryAction.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}