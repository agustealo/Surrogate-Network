import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { MemberNavigation } from '@/components/member/MemberNavigation';
import { MemberHeader } from '@/components/member/MemberHeader';
import { MobileNavigation } from '@/components/member/MobileNavigation';

export const metadata: Metadata = {
  title: 'Surrogate Companion - Member Area',
  description: 'Your personal connection space.',
};

export default function MemberLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MemberHeader />
      <div className="flex flex-1">
        <MemberNavigation />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>
      <MobileNavigation />
      <Toaster />
    </div>
  );
}