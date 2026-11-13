import { render, screen } from '@testing-library/react'
import SubmitFeedbackPage from '@/app/(member)/feedback/submit/page'
import { routes } from '@/lib/routes'

const mockGetUser = jest.fn()
const mockFrom = jest.fn()
const mockRedirect = jest.fn()

jest.mock('@/infrastructure/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))
jest.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}))
jest.mock('@/components/forms/FeedbackForm', () => ({
  FeedbackForm: () => <div>Authorized feedback form</div>,
}))

describe('Standalone Feedback entry journey', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRedirect.mockImplementation((path: string) => { throw new Error(`redirect:${path}`) })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'member-1' } } })
  })

  it('redirects missing sessions even when no Exchange was supplied', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(SubmitFeedbackPage({ searchParams: Promise.resolve({}) }))
      .rejects.toThrow(`redirect:${routes.public.login}`)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('guides signed-in members without an Exchange back to Connections', async () => {
    render(await SubmitFeedbackPage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByText(/Feedback starts from a completed Exchange/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Connections' }))
      .toHaveAttribute('href', routes.member.surrogacies)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('does not offer Feedback to an unrelated signed-in member', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'exchanges') {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({
          data: { id: 'exchange-1', surrogacy_id: 'relationship-1', status: 'completed', confirmation_state: 'confirmed' },
          error: null,
        }) }) }) }
      }
      if (table === 'surrogacies') {
        return { select: () => ({ eq: () => ({ single: async () => ({
          data: { id: 'relationship-1', partner_ids: ['member-2', 'member-3'], need_id: 'need-1', offer_id: 'offer-1' },
          error: null,
        }) }) }) }
      }
      throw new Error(`Unexpected query: ${table}`)
    })
    render(await SubmitFeedbackPage({ searchParams: Promise.resolve({ exchange: 'exchange-1' }) }))
    expect(screen.getByText('This Exchange is not available to your account.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Connections' }))
      .toHaveAttribute('href', routes.member.surrogacies)
    expect(screen.queryByText('Authorized feedback form')).not.toBeInTheDocument()
    expect(mockFrom).not.toHaveBeenCalledWith('needs')
    expect(mockFrom).not.toHaveBeenCalledWith('offers')
  })
})
