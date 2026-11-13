import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MomentScheduler } from '@/components/connections/MomentScheduler'

const mockCreateMomentAction = jest.fn()
const mockRefresh = jest.fn()
const mockToast = jest.fn()

jest.mock('lucide-react', () => ({ Loader2: () => null }))
jest.mock('@/application/actions/connectionActions', () => ({
  createMomentAction: (input: unknown) => mockCreateMomentAction(input),
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

describe('MomentScheduler', () => {
  beforeEach(() => jest.clearAllMocks())

  function submitMoment() {
    const { container } = render(<MomentScheduler surrogacyId="relationship-1" />)
    const dateInput = container.querySelector('input[type="datetime-local"]')
    if (!dateInput) throw new Error('Missing scheduling date input')
    fireEvent.change(dateInput, { target: { value: '2026-12-10T10:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Schedule Moment' }))
  }

  it('associates every visible scheduling label with its input', () => {
    render(<MomentScheduler surrogacyId="relationship-1" />)
    expect(screen.getByLabelText('Date & time')).toHaveAttribute('type', 'datetime-local')
    expect(screen.getByLabelText('Duration (minutes)')).toHaveAttribute('type', 'number')
    expect(screen.getByLabelText('Location / method')).toHaveAttribute('maxlength', '300')
    expect(screen.getByLabelText('Shared notes or expectations (optional)')).toHaveAttribute('maxlength', '2000')
  })

  it.each(['14', '1441', '30.5'])('rejects an invalid duration of %s before calling the server', (minutes) => {
    render(<MomentScheduler surrogacyId="relationship-1" />)
    fireEvent.change(screen.getByLabelText('Date & time'), { target: { value: '2026-12-10T10:00' } })
    fireEvent.change(screen.getByLabelText('Duration (minutes)'), { target: { value: minutes } })
    fireEvent.click(screen.getByRole('button', { name: 'Schedule Moment' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Duration must be a whole number between 15 and 1,440 minutes.')
    expect(mockCreateMomentAction).not.toHaveBeenCalled()
    expect(mockToast).not.toHaveBeenCalled()
  })

  it('records scheduling success only after a successful server response', async () => {
    mockCreateMomentAction.mockResolvedValue({ ok: true, data: { id: 'moment-1' } })
    submitMoment()
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Moment scheduled' }),
    ))
    expect(mockCreateMomentAction).toHaveBeenCalledWith(expect.objectContaining({
      surrogacyId: 'relationship-1',
      scheduledTime: new Date('2026-12-10T10:00').toISOString(),
      duration: 60,
    }))
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('preserves returned server failures and restores scheduling controls', async () => {
    mockCreateMomentAction.mockResolvedValue({ ok: false, error: 'Moment not permitted.' })
    submitMoment()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Moment not permitted.'))
    expect(screen.getByRole('button', { name: 'Schedule Moment' })).toBeEnabled()
    expect(mockToast).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('recovers from network rejection without false success', async () => {
    mockCreateMomentAction.mockRejectedValue(new Error('Sensitive transport detail'))
    submitMoment()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
      'The Moment could not be scheduled. Please check your connection and try again.',
    ))
    expect(screen.getByRole('button', { name: 'Schedule Moment' })).toBeEnabled()
    expect(screen.queryByText('Sensitive transport detail')).not.toBeInTheDocument()
    expect(mockToast).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
