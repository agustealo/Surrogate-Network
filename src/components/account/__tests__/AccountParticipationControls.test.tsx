import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AccountParticipationControls } from '@/components/account/AccountParticipationControls'
import { setTrialParticipationAction } from '@/application/actions/accountLifecycleActions'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn(), refresh: jest.fn() }),
}))
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}))
jest.mock('@/application/actions/accountLifecycleActions', () => ({
  setTrialParticipationAction: jest.fn(),
}))

describe('AccountParticipationControls', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('requires explicit confirmation before deactivation', () => {
    render(<AccountParticipationControls mode="deactivate" />)
    expect(screen.queryByRole('button', { name: 'Confirm Deactivation' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate Consumer Trial Account' }))
    expect(screen.getByRole('button', { name: 'Confirm Deactivation' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('button', { name: 'Confirm Deactivation' })).not.toBeInTheDocument()
  })

  it('recovers from a rejected request without losing the confirmation choice', async () => {
    jest.mocked(setTrialParticipationAction).mockRejectedValueOnce(new Error('Network offline'))
    render(<AccountParticipationControls mode="deactivate" />)
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate Consumer Trial Account' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Deactivation' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Please try again')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm Deactivation' })).toBeEnabled())
    expect(setTrialParticipationAction).toHaveBeenCalledWith(false)
  })
})
