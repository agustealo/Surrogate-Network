import { PublicFooter } from '@/components/public/PublicFooter'
import { PublicNavigation } from '@/components/public/PublicNavigation'
import { Toaster } from '@/components/ui/toaster'

export function PublicShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNavigation />
      <main className="flex-grow">{children}</main>
      <PublicFooter />
      <Toaster />
    </div>
  )
}
