import { readFileSync } from 'node:fs'
import path from 'node:path'

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('consumer shell truth', () => {
  it('uses one canonical user-facing product name across metadata and consumer chrome', () => {
    expect(source('src/lib/brand.ts')).toContain("BRAND_NAME = 'Surrogate Network'")

    for (const file of [
      'src/app/layout.tsx',
      'src/app/(public)/layout.tsx',
      'src/app/(public)/page.tsx',
      'src/components/public/PublicNavigation.tsx',
      'src/components/member/MemberNavigation.tsx',
      'src/components/member/MemberHeader.tsx',
    ]) {
      const contents = source(file)
      expect(contents).toContain('BRAND_NAME')
      expect(contents).not.toContain('Surrogate Companion')
    }
  })

  it('does not expose deferred or inert member-header controls', () => {
    const memberHeader = source('src/components/member/MemberHeader.tsx')

    expect(memberHeader).not.toContain('notificationCount')
    expect(memberHeader).not.toContain('tokenBalance')
    expect(memberHeader).not.toContain('Search needs and offers')
    expect(memberHeader).not.toContain('aria-label="Notifications"')
  })

  it('keeps admin chrome free of inert controls and page-level heading ownership', () => {
    const adminHeader = source('src/components/admin/AdminHeader.tsx')

    expect(adminHeader).not.toContain('Search administration')
    expect(adminHeader).not.toContain("from '@/components/ui/input'")
    expect(adminHeader).not.toContain('<h1')
  })

  it('gives public profiles session-aware product chrome without creating a second authorization authority', () => {
    const profileLayout = source('src/app/profile/layout.tsx')
    const publicShell = source('src/components/layout/PublicShell.tsx')
    const memberShell = source('src/components/layout/MemberShell.tsx')

    expect(profileLayout).toContain('auth.getUser()')
    expect(profileLayout).toContain('<MemberShell>{children}</MemberShell>')
    expect(profileLayout).toContain('<PublicShell>{children}</PublicShell>')
    expect(profileLayout).not.toContain('is_suspended')
    expect(profileLayout).not.toContain('trial_terms_version')
    expect(publicShell).toContain('<PublicNavigation />')
    expect(publicShell).toContain('<PublicFooter />')
    expect(memberShell).toContain('<MemberHeader />')
    expect(memberShell).toContain('<MemberNavigation />')
    expect(memberShell).toContain('<MobileNavigation />')
  })

  it('mounts toast feedback in both shells used by public-profile safety actions', () => {
    const safetyControls = source('src/components/safety/ProfileSafetyControls.tsx')
    const publicShell = source('src/components/layout/PublicShell.tsx')
    const memberShell = source('src/components/layout/MemberShell.tsx')

    expect(safetyControls).toContain("toast({ title: 'Report submitted'")
    expect(publicShell).toContain('<Toaster />')
    expect(memberShell).toContain('<Toaster />')
  })

  it('does not retain the obsolete mock AppHeader implementation', () => {
    expect(() => source('src/components/layout/AppHeader.tsx')).toThrow()
  })
})
