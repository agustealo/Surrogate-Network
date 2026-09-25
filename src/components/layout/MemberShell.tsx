import { MemberHeader } from '@/components/member/MemberHeader'
import { MemberNavigation } from '@/components/member/MemberNavigation'
import { MobileNavigation } from '@/components/member/MobileNavigation'
import { Toaster } from '@/components/ui/toaster'

export function MemberShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MemberHeader />
      <div className="flex flex-1">
        <MemberNavigation />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>
      <MobileNavigation />
      <Toaster />
    </div>
  )
}
