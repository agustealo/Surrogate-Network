import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemberNavigation } from '@/components/member/MemberNavigation'

let pathname = '/home'

jest.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

describe('MemberNavigation', () => {
  beforeEach(() => {
    pathname = '/home'
  })

  it('opens the relevant section when a member navigates into it', () => {
    const view = render(<MemberNavigation />)
    expect(screen.getByRole('navigation', { name: 'Member primary navigation' })).toBeInTheDocument()

    pathname = '/settings'
    act(() => view.rerender(<MemberNavigation />))

    expect(screen.getByRole('link', { name: 'Settings' }).closest('[aria-current="page"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Account' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('allows members to manually collapse an active section', () => {
    pathname = '/needs'
    render(<MemberNavigation />)
    const section = screen.getByRole('button', { name: 'My Activity' })
    expect(section).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(section)
    expect(section).toHaveAttribute('aria-expanded', 'false')
  })
})
