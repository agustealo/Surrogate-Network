import { routes } from '@/lib/routes'

describe('Route registry integration', () => {
  it('contains the canonical public routes', () => {
    expect(routes.public.home).toBe('/')
    expect(routes.public.login).toBe('/login')
    expect(routes.public.signup).toBe('/signup')
    expect(routes.public.forgotPassword).toBe('/forgot-password')
  })

  it('contains the implemented member routes', () => {
    expect(routes.member.home).toBe('/home')
    expect(routes.member.discover).toBe('/discover')
    expect(routes.member.messages).toBe('/messages')
    expect(routes.member.needsCreate).toBe('/needs/create')
    expect(routes.member.offersCreate).toBe('/offers/create')
  })

  it('contains only the implemented admin entry route', () => {
    expect(routes.admin).toEqual({ dashboard: '/admin' })
  })

  it('does not retain compatibility route registries', () => {
    expect('memberDynamic' in routes).toBe(false)
    expect('join' in routes.public).toBe(false)
    expect('members' in routes.admin).toBe(false)
  })
})
