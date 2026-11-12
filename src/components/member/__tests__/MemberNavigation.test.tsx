import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemberNavigation } from '@/components/member/MemberNavigation'

const mockSignOut = jest.fn()
const mockPush = jest.fn()
const mockRefresh = jest.fn()
const mockToast = jest.fn()
let pathname = '/home'

jest.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

jest.mock('@/infrastructure/supabase/browser', () => ({
  createClient: () => ({ auth: { signOut: mockSignOut } }),
}))
jest.mock('@/hooks/use-toast', () => ({ toast: (options: unknown) => mockToast(options) }))

describe('MemberNavigation', () => {
  beforeEach(() => {
    pathname = '/home'
    jest.clearAllMocks()
  })

  it('renders each desktop destination once without a duplicate General group', () => {
    const { container } = render(<MemberNavigation />)
    const nav = screen.getByRole('navigation', { name: 'Member primary navigation' })
    fireEvent.click(screen.getByRole('button', { name: 'My Activity' }))
    fireEvent.click(screen.getByRole('button', { name: 'Account' }))

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
  it('does not redirect or claim success when sign-out returns an error', async () => {
    mockSignOut.mockResolvedValue({ error: new Error('Provider unavailable') })
    render(<MemberNavigation />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
    })

    expect(mockSignOut).toHaveBeenCalledTimes(1)
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'destructive',
      title: 'Sign out failed',
    }))
  })

  it('redirects after confirmed sign-out', async () => {
    mockSignOut.mockResolvedValue({ error: null })
    render(<MemberNavigation />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
    })

    expect(mockPush).toHaveBeenCalledWith('/login')
    expect(mockRefresh).toHaveBeenCalledTimes(1)
    expect(mockToast).not.toHaveBeenCalled()
  })

})
