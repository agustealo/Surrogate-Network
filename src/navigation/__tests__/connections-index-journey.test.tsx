import { render, screen } from '@testing-library/react'
import MemberSurrogaciesPage from '@/app/(member)/surrogacies/page'
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

describe('Connections index consumer journey', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'member-1' } } })
    mockRedirect.mockImplementation((path: string) => { throw new Error(`redirect:${path}`) })
  })

  it('redirects a missing member session before reading private Connections', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(MemberSurrogaciesPage()).rejects.toThrow(`redirect:${routes.public.login}`)
    expect(mockRedirect).toHaveBeenCalledWith(routes.public.login)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('gives an empty Connections index accurate context and discovery action', async () => {
    const order = jest.fn().mockResolvedValue({ data: [], error: null })
    const contains = jest.fn().mockReturnValue({ order })
    const select = jest.fn().mockReturnValue({ contains })
    mockFrom.mockReturnValue({ select })

    render(await MemberSurrogaciesPage())
    expect(mockFrom).toHaveBeenCalledWith('surrogacies')
    expect(contains).toHaveBeenCalledWith('partner_ids', ['member-1'])
    expect(screen.getByText(/No Connections yet/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explore Discover' })).toHaveAttribute('href', routes.member.discover)
    expect(screen.getByRole('link', { name: 'View Proposals' })).toHaveAttribute('href', routes.member.proposals)
  })

  it('links an existing historical Connection to its canonical detail page', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [{
        id: 'connection-1',
        status: 'ended',
        started_at: '2026-10-10T12:00:00Z',
        ended_at: '2026-10-11T12:00:00Z',
        need_id: 'need-1',
        offer_id: 'offer-1',
      }],
      error: null,
    })
    const contains = jest.fn().mockReturnValue({ order })
    const needsIn = jest.fn().mockResolvedValue({ data: [{ id: 'need-1', title: 'Help moving' }], error: null })
    const offersIn = jest.fn().mockResolvedValue({ data: [{ id: 'offer-1', title: 'Moving support' }], error: null })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'surrogacies') return { select: () => ({ contains }) }
      if (table === 'needs') return { select: () => ({ in: needsIn }) }
      if (table === 'offers') return { select: () => ({ in: offersIn }) }
      throw new Error(`Unexpected table: ${table}`)
    })

    render(await MemberSurrogaciesPage())
    expect(screen.getByText('Help moving ↔ Moving support')).toBeInTheDocument()
    expect(screen.getByText('ended')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Connection' })).toHaveAttribute(
      'href',
      routes.memberDynamic.surrogacy('connection-1'),
    )
  })
})
