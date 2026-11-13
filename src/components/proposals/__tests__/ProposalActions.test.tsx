import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ProposalActions } from '@/components/proposals/ProposalActions'

const mockAcceptProposalAction = jest.fn()
const mockDeclineProposalAction = jest.fn()
const mockWithdrawProposalAction = jest.fn()
const mockCounterProposalAction = jest.fn()
const mockPush = jest.fn()
const mockRefresh = jest.fn()
const mockToast = jest.fn()

jest.mock('lucide-react', () => ({ Loader2: () => null }))
jest.mock('@/application/actions/marketplaceActions', () => ({
  acceptProposalAction: (id: string) => mockAcceptProposalAction(id),
  declineProposalAction: (id: string) => mockDeclineProposalAction(id),
  withdrawProposalAction: (id: string) => mockWithdrawProposalAction(id),
  counterProposalAction: (values: unknown) => mockCounterProposalAction(values),
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }))

const props = {
  proposalId: 'proposal-123',
  status: 'pending' as const,
  currentUserId: 'recipient-1',
  proposingUserId: 'proposer-1',
  receivingUserId: 'recipient-1',
}

describe('ProposalActions', () => {
  beforeEach(() => jest.clearAllMocks())

  it('navigates only when acceptance returns a confirmed surrogacy', async () => {
    mockAcceptProposalAction.mockResolvedValue({ ok: true, data: { surrogacyId: 'relationship-1' } })
    render(<ProposalActions {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
    expect(mockAcceptProposalAction).not.toHaveBeenCalled()
    expect(screen.getByText('Accept this proposal?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm acceptance' }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/surrogacies/relationship-1'))
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Proposal accepted' }))
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('shows structured action errors and restores controls without navigating', async () => {
    mockAcceptProposalAction.mockResolvedValue({ ok: false, error: 'Proposal is no longer active.' })
    render(<ProposalActions {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm acceptance' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Proposal is no longer active.'))
    expect(screen.getByRole('button', { name: 'Accept' })).toBeEnabled()
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockToast).not.toHaveBeenCalled()
  })

  it.each([
    ['accept', 'Accept', mockAcceptProposalAction, props],
    ['decline', 'Decline', mockDeclineProposalAction, props],
    ['withdraw', 'Withdraw', mockWithdrawProposalAction, { ...props, currentUserId: 'proposer-1' }],
    ['counter', 'Send counter', mockCounterProposalAction, props],
  ])('restores controls when %s rejects unexpectedly', async (_, buttonName, action, options) => {
    action.mockRejectedValue(new Error('Internal request details'))
    render(<ProposalActions {...options} />)
    if (buttonName === 'Send counter') {
      fireEvent.click(screen.getByRole('button', { name: 'Counter' }))
    }
    fireEvent.click(screen.getByRole('button', { name: buttonName }))
    if (buttonName !== 'Send counter') {
      const confirmLabel = buttonName === 'Accept'
        ? 'Confirm acceptance'
        : buttonName === 'Decline'
          ? 'Confirm decline'
          : 'Confirm withdrawal'
      fireEvent.click(screen.getByRole('button', { name: confirmLabel }))
    }
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
      'Your proposal action could not be completed. Please try again.',
    ))
    expect(screen.getByRole('button', { name: buttonName })).toBeEnabled()
    expect(screen.queryByText('Internal request details')).not.toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
    expect(mockToast).not.toHaveBeenCalled()
  })
  it.each([
    ['Accept', 'Confirm acceptance', mockAcceptProposalAction, props],
    ['Decline', 'Confirm decline', mockDeclineProposalAction, props],
    ['Withdraw', 'Confirm withdrawal', mockWithdrawProposalAction, { ...props, currentUserId: 'proposer-1' }],
  ])('explains %s before running its transition and allows cancelling review', (actionLabel, confirmLabel, action, options) => {
    render(<ProposalActions {...options} />)
    fireEvent.click(screen.getByRole('button', { name: actionLabel }))
    expect(screen.getByRole('region', { name: 'Review proposal decision' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: confirmLabel })).toBeEnabled()
    expect(action).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Keep reviewing' }))
    expect(screen.queryByRole('region', { name: 'Review proposal decision' })).not.toBeInTheDocument()
    expect(action).not.toHaveBeenCalled()
  })

  it('explains that countering requires the other member to respond', () => {
    render(<ProposalActions {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Counter' }))
    expect(screen.getByText(/A counter does not create a Connection/)).toBeInTheDocument()
    expect(mockCounterProposalAction).not.toHaveBeenCalled()
  })

})
