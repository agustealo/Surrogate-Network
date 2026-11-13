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
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/surrogacies/relationship-1'))
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Proposal accepted' }))
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('shows structured action errors and restores controls without navigating', async () => {
    mockAcceptProposalAction.mockResolvedValue({ ok: false, error: 'Proposal is no longer active.' })
    render(<ProposalActions {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
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
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
      'Your proposal action could not be completed. Please try again.',
    ))
    expect(screen.getByRole('button', { name: buttonName })).toBeEnabled()
    expect(screen.queryByText('Internal request details')).not.toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
    expect(mockToast).not.toHaveBeenCalled()
  })
})
