import { routes } from '@/lib/routes'

describe('Route registry integration', () => {
  it('contains the canonical public routes', () => {
    expect(routes.public.home).toBe('/')
    expect(routes.public.login).toBe('/login')
    expect(routes.public.signup).toBe('/signup')
    expect(routes.public.forgotPassword).toBe('/forgot-password')
    expect(routes.public.resetPassword).toBe('/reset-password')
    expect(routes.public.authRecovery).toBe('/auth/recovery')
    expect(routes.public.accountDeleted).toBe('/account-deleted')
  })

  it('contains the implemented member routes', () => {
    expect(routes.member.home).toBe('/home')
    expect(routes.member.discover).toBe('/discover')
    expect(routes.member.messages).toBe('/messages')
    expect(routes.member.needsCreate).toBe('/needs/create')
    expect(routes.member.offersCreate).toBe('/offers/create')
    expect(routes.member.accountExport).toBe('/account/export')
  })

  it('contains the implemented admin routes', () => {
    expect(routes.admin).toEqual({
      dashboard: '/admin',
      reports: '/admin/reports',
    })
  })

  it('keeps canonical dynamic route builders without compatibility aliases', () => {
    expect(routes.memberDynamic.profile('user-1')).toBe('/profile/user-1')
    expect(routes.memberDynamic.need('need-1')).toBe('/needs/need-1')
    expect(routes.memberDynamic.offer('offer-1')).toBe('/offers/offer-1')
    expect(routes.memberDynamic.surrogacy('surrogacy-1')).toBe('/surrogacies/surrogacy-1')
    expect('join' in routes.public).toBe(false)
    expect('members' in routes.admin).toBe(false)
  })
})
