import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FeedbackForm } from '@/components/forms/FeedbackForm'

const mockSubmitFeedbackAction = jest.fn()
const mockRefresh = jest.fn()
const mockToast = jest.fn()
const mockOnSubmitted = jest.fn()

jest.mock('lucide-react', () => ({
  Loader2: () => null,
  Check: () => null,
  ChevronDown: () => null,
  ChevronUp: () => null,
}))
jest.mock('@/application/actions/connectionActions', () => ({
  submitFeedbackAction: (input: unknown) => mockSubmitFeedbackAction(input),
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

describe('FeedbackForm', () => {
  beforeEach(() => jest.clearAllMocks())

  function submitFeedback() {
    render(
      <FeedbackForm
        exchangeId="exchange-1"
        toUserId="member-2"
        companionName="Another Member"
        onSubmitted={mockOnSubmitted}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Submit Feedback' }))
  }

  it('associates each rating and optional field with an accessible name', () => {
    render(
      <FeedbackForm
        exchangeId="exchange-1"
        toUserId="member-2"
        companionName="Another Member"
      />,
    )

    for (const label of [
      'Reliability',
      'Communication',
      'Boundary respect',
      'Consideration',
      'Follow-through',
    ]) {
      expect(screen.getByRole('combobox', { name: label })).toBeInTheDocument()
    }
    expect(screen.getByRole('textbox', { name: 'Optional comments' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Skill endorsements' })).toBeInTheDocument()
  })

  it('reports success and refreshes only on confirmed feedback submission', async () => {
    mockSubmitFeedbackAction.mockResolvedValue({ ok: true, data: undefined })
    submitFeedback()
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Feedback submitted' }),
    ))
    expect(mockSubmitFeedbackAction).toHaveBeenCalledWith(expect.objectContaining({
      exchangeId: 'exchange-1',
      toUserId: 'member-2',
      reliability: 3,
      communication: 3,
      boundaryRespect: 3,
      consideration: 3,
      followThrough: 3,
    }))
    expect(mockOnSubmitted).toHaveBeenCalledTimes(1)
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('preserves server failure responses and restores submission controls', async () => {
    mockSubmitFeedbackAction.mockResolvedValue({ ok: false, error: 'Feedback is not available.' })
    submitFeedback()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Feedback is not available.'))
    expect(screen.getByRole('button', { name: 'Submit Feedback' })).toBeEnabled()
    expect(mockToast).not.toHaveBeenCalled()
    expect(mockOnSubmitted).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('restores submission after a network rejection without falsely claiming success', async () => {
    mockSubmitFeedbackAction.mockRejectedValue(new Error('Sensitive network detail'))
    submitFeedback()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
      'Your feedback could not be submitted. Please check your connection and try again.',
    ))
    expect(screen.getByRole('button', { name: 'Submit Feedback' })).toBeEnabled()
    expect(screen.queryByText('Sensitive network detail')).not.toBeInTheDocument()
    expect(mockToast).not.toHaveBeenCalled()
    expect(mockOnSubmitted).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
