import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { PublicNavigation } from '@/components/public/PublicNavigation';
import { PublicFooter } from '@/components/public/PublicFooter';

export const metadata: Metadata = {
  title: 'Surrogate Companion',
  description: 'Find meaningful connections through needs-based relationships.',
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicNavigation />
      <main className="flex-grow">{children}</main>
      <PublicFooter />
      <Toaster />
    </div>
  );
}