import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import { AdminNavigation } from '@/components/admin/AdminNavigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { createClient } from '@/infrastructure/supabase/server';

export const metadata: Metadata = {
  title: 'Surrogate Network - Admin Console',
  description: 'Administrative interface.',
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/home');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AdminHeader />
      <div className="flex flex-1">
        <AdminNavigation />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
