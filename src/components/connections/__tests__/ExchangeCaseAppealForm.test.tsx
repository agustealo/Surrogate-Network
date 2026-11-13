import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ExchangeCaseAppealForm } from '@/components/connections/ExchangeCaseAppealForm'

const mockSubmitExchangeCaseAppealAction = jest.fn()
const mockRefresh = jest.fn()
const mockToast = jest.fn()

jest.mock('@/application/actions/moderationActions', () => ({
  submitExchangeCaseAppealAction: (input: unknown) => mockSubmitExchangeCaseAppealAction(input),
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

describe('ExchangeCaseAppealForm', () => {
  beforeEach(() => jest.clearAllMocks())

  function submitAppeal() {
    render(<ExchangeCaseAppealForm reportId="report-1" />)
    fireEvent.change(screen.getByLabelText('Reason for appeal'), {
      target: { value: 'The evidence was not reviewed accurately.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit appeal' }))
  }

  it('only announces submission after a confirmed successful action', async () => {
    mockSubmitExchangeCaseAppealAction.mockResolvedValue({ ok: true, data: undefined })
    submitAppeal()
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Appeal submitted' }),
    ))
    expect(mockSubmitExchangeCaseAppealAction).toHaveBeenCalledWith({
      reportId: 'report-1',
      reason: 'The evidence was not reviewed accurately.',
    })
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('shows an authoritative rejection without claiming success', async () => {
    mockSubmitExchangeCaseAppealAction.mockResolvedValue({ ok: false, error: 'Appeal period expired.' })
    submitAppeal()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Appeal period expired.'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit appeal' })).toBeEnabled())
    expect(mockToast).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('allows retry after transport rejection without disclosing internals', async () => {
    mockSubmitExchangeCaseAppealAction.mockRejectedValue(new Error('Sensitive transport details'))
    submitAppeal()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
      'Your appeal could not be submitted. Please check your connection and try again.',
    ))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit appeal' })).toBeEnabled())
    expect(screen.queryByText('Sensitive transport details')).not.toBeInTheDocument()
    expect(mockToast).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
