import { render, screen } from '@testing-library/react'
import { MemberShell } from '@/components/layout/MemberShell'

jest.mock('@/components/member/MemberHeader', () => ({
  MemberHeader: () => <header data-testid="member-header" />,
}))
jest.mock('@/components/member/MemberNavigation', () => ({
  MemberNavigation: () => <aside data-testid="desktop-navigation" />,
}))
jest.mock('@/components/member/MobileNavigation', () => ({
  MobileNavigation: () => <nav data-testid="mobile-navigation" />,
}))
jest.mock('@/components/ui/toaster', () => ({
  Toaster: () => null,
}))

describe('MemberShell', () => {
  it('reserves bottom navigation and device safe-area space for member content', () => {
    render(<MemberShell><button type="button">Last page action</button></MemberShell>)

    const main = screen.getByRole('main')
    expect(main).toContainElement(screen.getByRole('button', { name: 'Last page action' }))
    expect(main).toHaveClass('pb-[calc(4rem+env(safe-area-inset-bottom))]')
    expect(main).toHaveClass('md:pb-0')
    expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument()
  })
})
