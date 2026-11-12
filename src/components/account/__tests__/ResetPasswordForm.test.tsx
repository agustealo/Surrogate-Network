import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ResetPasswordForm } from '@/components/account/ResetPasswordForm'

const mockCompletePasswordRecoveryAction = jest.fn()
const mockReplace = jest.fn()
const mockRefresh = jest.fn()

jest.mock('@/application/actions/accountRecoveryActions', () => ({
  completePasswordRecoveryAction: (input: unknown) => mockCompletePasswordRecoveryAction(input),
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }),
}))

describe('ResetPasswordForm', () => {
  beforeEach(() => jest.clearAllMocks())

  function submitPassword() {
    render(<ResetPasswordForm />)
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'sufficiently-long-password' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'sufficiently-long-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }))
  }

  it('redirects only after a successful password update', async () => {
    mockCompletePasswordRecoveryAction.mockResolvedValue({ ok: true, data: undefined })
    submitPassword()
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/home'))
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('displays the server action failure and does not redirect', async () => {
    mockCompletePasswordRecoveryAction.mockResolvedValue({ ok: false, error: 'Recovery expired.' })
    submitPassword()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Recovery expired.'))
    expect(screen.getByRole('button', { name: 'Update password' })).toBeEnabled()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('restores the form after a rejected server action without false success', async () => {
    mockCompletePasswordRecoveryAction.mockRejectedValue(new Error('Network interrupted'))
    submitPassword()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not update your password right now. Please try again.',
    ))
    expect(screen.getByRole('button', { name: 'Update password' })).toBeEnabled()
    expect(mockReplace).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
    expect(screen.queryByText('Network interrupted')).not.toBeInTheDocument()
  })
})
