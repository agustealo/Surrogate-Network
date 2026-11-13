import { render, screen } from '@testing-library/react'
import MemberNeedsPage from '@/app/(member)/needs/page'
import MemberOffersPage from '@/app/(member)/offers/page'
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

describe('Member listing navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'member-1' } } })
    mockRedirect.mockImplementation((path: string) => { throw new Error(`redirect:${path}`) })
  })

  function setupListings(table: string, entries: Array<{ id: string; title: string; description: string; status: string }>) {
    const order = jest.fn().mockResolvedValue({ data: entries, error: null })
    const eq = jest.fn().mockReturnValue({ order })
    const select = jest.fn().mockReturnValue({ eq })
    mockFrom.mockImplementation((source: string) => {
      expect(source).toBe(table)
      return { select }
    })
    return { eq }
  }

  it.each([
    ['Need', 'needs', MemberNeedsPage, routes.member.needsCreate, routes.memberDynamic.need('listing-1')],
    ['Offer', 'offers', MemberOffersPage, routes.member.offersCreate, routes.memberDynamic.offer('listing-1')],
  ])('opens an owned %s listing from its collection', async (name, table, Page, _createPath, detailPath) => {
    const { eq } = setupListings(table, [{ id: 'listing-1', title: 'My listing', description: 'A useful description', status: 'active' }])
    render(await Page())
    expect(screen.getByRole('link', { name: `View ${name}` })).toHaveAttribute('href', detailPath)
    expect(screen.getByText('My listing')).toBeInTheDocument()
    expect(eq).toHaveBeenCalledWith('user_id', 'member-1')
  })

  it.each([
    ['Need', 'needs', MemberNeedsPage, routes.member.needsCreate],
    ['Offer', 'offers', MemberOffersPage, routes.member.offersCreate],
  ])('gives an empty %s collection an immediate next action', async (name, table, Page, createPath) => {
    setupListings(table, [])
    render(await Page())
    expect(screen.getByRole('link', { name: `Create your first ${name}` })).toHaveAttribute('href', createPath)
    expect(screen.getByRole('link', { name: 'Explore Discover' })).toHaveAttribute('href', routes.member.discover)
  })

  it.each([
    ['Need', MemberNeedsPage],
    ['Offer', MemberOffersPage],
  ])('redirects unauthenticated %s collection requests before querying listings', async (_name, Page) => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(Page()).rejects.toThrow(`redirect:${routes.public.login}`)
    expect(mockRedirect).toHaveBeenCalledWith(routes.public.login)
    expect(mockFrom).not.toHaveBeenCalled()
  })
})
