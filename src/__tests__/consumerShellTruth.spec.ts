import { readFileSync } from 'node:fs'
import path from 'node:path'

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('consumer shell truth', () => {
  it('uses one canonical user-facing product name across public and member chrome', () => {
    expect(source('src/lib/brand.ts')).toContain("BRAND_NAME = 'Surrogate Network'")

    for (const file of [
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

  it('mounts toast feedback wherever public-profile safety actions can run', () => {
    const publicProfile = source('src/app/profile/[id]/page.tsx')
    const safetyControls = source('src/components/safety/ProfileSafetyControls.tsx')

    expect(safetyControls).toContain("toast({ title: 'Report submitted'")
    expect(publicProfile).toContain("from '@/components/ui/toaster'")
    expect(publicProfile).toContain('<Toaster />')
  })

  it('does not retain the obsolete mock AppHeader implementation', () => {
    expect(() => source('src/components/layout/AppHeader.tsx')).toThrow()
  })
})
