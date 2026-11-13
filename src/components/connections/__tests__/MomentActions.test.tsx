import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MomentActions } from '@/components/connections/MomentActions'

const mockCompleteMomentAction = jest.fn()
const mockCancelMomentAction = jest.fn()
const mockRefresh = jest.fn()
const mockToast = jest.fn()

jest.mock('lucide-react', () => ({ Loader2: () => null }))
jest.mock('@/application/actions/connectionActions', () => ({
  completeMomentAction: (...args: unknown[]) => mockCompleteMomentAction(...args),
  cancelMomentAction: (...args: unknown[]) => mockCancelMomentAction(...args),
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }))

describe('MomentActions', () => {
  beforeEach(() => jest.clearAllMocks())

  const renderActions = () => render(<MomentActions momentId="moment-1" surrogacyId="relationship-1" />)

  it('reports completion success only after a confirmed server result', async () => {
    mockCompleteMomentAction.mockResolvedValue({ ok: true, data: undefined })
    renderActions()
    fireEvent.click(screen.getByRole('button', { name: 'Complete' }))
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Exchange recorded' }),
    ))
    expect(mockCompleteMomentAction).toHaveBeenCalledWith('moment-1', 'relationship-1', 'completed')
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('preserves structured server errors without false success', async () => {
    mockCancelMomentAction.mockResolvedValue({ ok: false, error: 'Moment cannot be cancelled.' })
    renderActions()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Moment cannot be cancelled.'))
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled()
    expect(mockToast).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it.each([
    ['Complete', 'completed', 'The Moment could not be updated. Please check your connection and try again.'],
    ['Partial', 'partial', 'The Moment could not be updated. Please check your connection and try again.'],
    ['Disputed', 'disputed', 'The Moment could not be updated. Please check your connection and try again.'],
    ['Cancel', 'cancel', 'The Moment could not be cancelled. Please check your connection and try again.'],
  ])('restores %s control when its action rejects', async (button, status, expected) => {
    if (status === 'cancel') {
      mockCancelMomentAction.mockRejectedValue(new Error('Sensitive transport details'))
    } else {
      mockCompleteMomentAction.mockRejectedValue(new Error('Sensitive transport details'))
    }
    renderActions()
    fireEvent.click(screen.getByRole('button', { name: button }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(expected))
    expect(screen.getByRole('button', { name: button })).toBeEnabled()
    expect(screen.queryByText('Sensitive transport details')).not.toBeInTheDocument()
    expect(mockToast).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
