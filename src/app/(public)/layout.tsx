import type { Metadata } from 'next'
import { PublicShell } from '@/components/layout/PublicShell'
import { BRAND_NAME } from '@/lib/brand'

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: 'Find meaningful connections through needs-based relationships.',
}

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PublicShell>{children}</PublicShell>
}
