import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ExchangeConfirmationActions } from '@/components/connections/ExchangeConfirmationActions'

const mockConfirmExchangeAction = jest.fn()
const mockRefresh = jest.fn()
const mockToast = jest.fn()

jest.mock('lucide-react', () => ({
  CheckCheck: () => null,
  Flag: () => null,
  Loader2: () => null,
}))
jest.mock('@/application/actions/connectionActions', () => ({
  confirmExchangeAction: (input: unknown) => mockConfirmExchangeAction(input),
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

describe('ExchangeConfirmationActions', () => {
  beforeEach(() => jest.clearAllMocks())

  function renderDecision() {
    render(
      <ExchangeConfirmationActions
        exchangeId="exchange-1"
        surrogacyId="connection-1"
        reportedStatus="partial"
      />,
    )
  }

  it('makes both decisions and their consequences discoverable before submission', () => {
    renderDecision()
    const confirm = screen.getByRole('button', { name: 'Confirm outcome' })
    const dispute = screen.getByRole('button', { name: 'Dispute outcome' })
    expect(confirm).toHaveAccessibleDescription(/feedback available/i)
    expect(dispute).toHaveAccessibleDescription(/cannot be changed/i)
    expect(screen.getByText(/reported this Exchange as partial/i)).toBeInTheDocument()
  })

  it('reports a confirmed Exchange only after a successful server response', async () => {
    mockConfirmExchangeAction.mockResolvedValue({ ok: true, data: { state: 'confirmed' } })
    renderDecision()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm outcome' }))
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Exchange confirmed' }),
    ))
    expect(mockConfirmExchangeAction).toHaveBeenCalledWith({
      exchangeId: 'exchange-1',
      surrogacyId: 'connection-1',
      decision: 'confirm',
    })
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('keeps server rejection visible and does not claim success', async () => {
    mockConfirmExchangeAction.mockResolvedValue({ ok: false, error: 'Exchange already decided.' })
    renderDecision()
    fireEvent.click(screen.getByRole('button', { name: 'Dispute outcome' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Exchange already decided.'))
    expect(screen.getByRole('button', { name: 'Dispute outcome' })).toBeEnabled()
    expect(mockToast).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('offers retry after an action rejection without exposing transport details', async () => {
    mockConfirmExchangeAction.mockRejectedValue(new Error('Private transport detail'))
    renderDecision()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm outcome' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
      'The decision could not be saved. Check your connection and try again.',
    ))
    expect(screen.getByRole('button', { name: 'Confirm outcome' })).toBeEnabled()
    expect(screen.queryByText('Private transport detail')).not.toBeInTheDocument()
    expect(mockToast).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
