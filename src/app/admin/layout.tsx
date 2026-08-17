import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { AdminNavigation } from '@/components/admin/AdminNavigation';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const metadata: Metadata = {
  title: 'Surrogate Companion - Admin Console',
  description: 'Administrative interface.',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AdminHeader />
      <div className="flex flex-1">
        <AdminNavigation />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}