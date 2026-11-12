import { act, fireEvent, render, screen, within } from '@testing-library/react'
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

  it('renders each desktop destination once without a duplicate General group', () => {
    const { container } = render(<MemberNavigation />)
    const nav = screen.getByRole('navigation', { name: 'Member primary navigation' })

    for (const [label, href] of [
      ['Home', '/home'],
      ['Discover', '/discover'],
      ['Proposals', '/proposals'],
      ['Connections', '/surrogacies'],
      ['Rewards & Progress', '/rewards'],
      ['Settings', '/settings'],
    ]) {
      const links = within(nav).getAllByRole('link', { name: label })
      expect(links).toHaveLength(1)
      expect(links[0]).toHaveAttribute('href', href)
    }

    expect(within(nav).queryByRole('button', { name: 'General' })).not.toBeInTheDocument()
    expect(container.querySelectorAll('a[href="/settings"]')).toHaveLength(1)
    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
  })

  it('opens the relevant section when a member navigates into it', () => {
    const view = render(<MemberNavigation />)
    expect(screen.getByRole('navigation', { name: 'Member primary navigation' })).toBeInTheDocument()

    pathname = '/settings'
    act(() => view.rerender(<MemberNavigation />))

    expect(within(screen.getByRole('navigation', { name: 'Member primary navigation' })).getByRole('link', { name: 'Settings' })).toHaveAttribute('aria-current', 'page')
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
