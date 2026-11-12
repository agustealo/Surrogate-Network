import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SignUpForm } from '@/components/forms/SignUpForm'
import { TRIAL_POLICY_VERSION } from '@/lib/trialPolicy'

const mockSignUp = jest.fn()
const mockReplace = jest.fn()
const mockRefresh = jest.fn()
const mockToast = jest.fn()

jest.mock('lucide-react', () => ({
  UserPlus: () => null,
  Mail: () => null,
  Lock: () => null,
  UserCircle2: () => null,
}))
jest.mock('@/infrastructure/supabase/browser', () => ({
  createClient: () => ({ auth: { signUp: mockSignUp } }),
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }),
}))
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

describe('SignUpForm', () => {
  beforeEach(() => jest.clearAllMocks())

  async function submitRegistration() {
    render(<SignUpForm />)
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Trial Member' },
    })
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'member@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'safe-test-password' },
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'safe-test-password' },
    })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))
    await waitFor(() => expect(mockSignUp).toHaveBeenCalledTimes(1))
  }

  it('preserves trial consent metadata and directs confirmed sessions to profile setup', async () => {
    mockSignUp.mockResolvedValue({ data: { session: { access_token: 'test' } }, error: null })
    await submitRegistration()
    expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'member@example.com',
      options: {
        data: expect.objectContaining({
          name: 'Trial Member',
          trial_terms_version: TRIAL_POLICY_VERSION,
          trial_privacy_version: TRIAL_POLICY_VERSION,
          trial_age_confirmed: true,
        }),
      },
    }))
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/profile/create'))
    expect(mockRefresh).toHaveBeenCalledTimes(1)
    expect(mockToast).not.toHaveBeenCalled()
  })

  it('prompts for email confirmation only after provider accepted signup', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null })
    await submitRegistration()
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Check your email',
    })))
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('does not claim success when signup is rejected by the provider', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: { message: 'Registration unavailable' } })
    await submitRegistration()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Registration unavailable'))
    expect(mockToast).not.toHaveBeenCalled()
    expect(mockReplace).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeEnabled()
  })

  it('recovers from network exceptions with a retryable error instead of false confirmation', async () => {
    mockSignUp.mockRejectedValue(new Error('Internal transport details'))
    await submitRegistration()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not create your account right now. Please check your connection and try again.',
    ))
    expect(screen.queryByText('Internal transport details')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeEnabled()
    expect(mockToast).not.toHaveBeenCalled()
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
