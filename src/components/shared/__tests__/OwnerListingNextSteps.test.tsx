import { render, screen } from '@testing-library/react'
import { OwnerListingNextSteps } from '@/components/shared/OwnerListingNextSteps'
import { routes } from '@/lib/routes'

describe('OwnerListingNextSteps', () => {
  it.each([
    ['Need', 'Offer'],
    ['Offer', 'Need'],
  ] as const)('explains how an owner of a %s receives proposals', (kind, counterpart) => {
    render(<OwnerListingNextSteps kind={kind} />)
    expect(screen.getByText('What happens next?')).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`pair it with.*${counterpart}`))).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review Proposals' })).toHaveAttribute('href', routes.member.proposals)
    expect(screen.getByRole('link', { name: 'Explore Discover' })).toHaveAttribute('href', routes.member.discover)
  })
})
