import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LoginForm } from '@/components/forms/LoginForm'

const mockSignInWithPassword = jest.fn()
const mockReplace = jest.fn()
const mockRefresh = jest.fn()
const mockToast = jest.fn()

jest.mock('@/infrastructure/supabase/browser', () => ({
  createClient: () => ({ auth: { signInWithPassword: mockSignInWithPassword } }),
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }),
}))
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

describe('LoginForm', () => {
  beforeEach(() => jest.clearAllMocks())

  async function submitCredentials() {
    render(<LoginForm />)
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'member@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'safe-test-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(mockSignInWithPassword).toHaveBeenCalledTimes(1))
  }

  it('navigates only after confirmed successful sign in', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    await submitCredentials()
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/home'))
    expect(mockRefresh).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Welcome back' }))
  })

  it('displays returned provider errors without navigating', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    await submitCredentials()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Invalid login credentials'))
    expect(mockReplace).not.toHaveBeenCalled()
    expect(mockToast).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })

  it('shows a retryable message on rejected network requests without false success', async () => {
    mockSignInWithPassword.mockRejectedValue(new Error('Internal transport details'))
    await submitCredentials()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not sign you in right now. Please check your connection and try again.',
    ))
    expect(screen.queryByText('Internal transport details')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
    expect(mockReplace).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
    expect(mockToast).not.toHaveBeenCalled()
  })
})
