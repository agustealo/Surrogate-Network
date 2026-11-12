import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ForgotPasswordPage from '@/app/(public)/forgot-password/page'

const mockResetPasswordForEmail = jest.fn()

jest.mock('@/infrastructure/supabase/browser', () => ({
  createClient: () => ({
    auth: { resetPasswordForEmail: mockResetPasswordForEmail },
  }),
}))

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function submitRecoveryEmail() {
    render(<ForgotPasswordPage />)
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'member@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
  }

  it('keeps the recovery response account-enumeration-safe after success', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    submitRecoveryEmail()

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'If an account exists for that email, a password reset link has been sent.',
      )
    })
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'member@example.com',
      { redirectTo: `${window.location.origin}/auth/recovery` },
    )
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeEnabled()
  })

  it.each([
    ['provider error', () => Promise.resolve({ error: new Error('Provider unavailable') })],
    ['network exception', () => Promise.reject(new Error('Connection lost'))],
  ])('recovers from %s without exposing provider details or trapping the submit button', async (_, response) => {
    mockResetPasswordForEmail.mockImplementation(response)
    submitRecoveryEmail()

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'We could not send the reset link right now. Please try again.',
      )
    })
    expect(screen.queryByText('Provider unavailable')).not.toBeInTheDocument()
    expect(screen.queryByText('Connection lost')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeEnabled()
  })
})
