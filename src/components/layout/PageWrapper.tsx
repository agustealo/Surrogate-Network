
import type { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function PageWrapper({ children, title, className }: PageWrapperProps) {
  return (
    <main className={`container mx-auto px-4 py-8 sm:px-6 lg:px-8 ${className}`}>
      {title && (
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
      )}
      {children}
    </main>
  );
}
