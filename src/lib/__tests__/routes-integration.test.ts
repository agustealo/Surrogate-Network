// Integration tests for route helpers

import { routes } from '@/lib/routes'

describe('Route helpers integration', () => {
  it('should provide consistent route paths across application', () => {
    expect(routes.public.home).toBe('/')
    expect(routes.public.login).toBe('/login')
    expect(routes.public.join).toBe('/join')
  })

  it('should provide member route paths', () => {
    expect(routes.member.home).toBe('/home')
    expect(routes.member.discover).toBe('/discover')
    expect(routes.member.messages).toBe('/messages')
    expect(routes.member.needsCreate).toBe('/needs/create')
  })

  it('should provide admin route paths', () => {
    expect(routes.admin.dashboard).toBe('/admin')
    expect(routes.admin.members).toBe('/admin/members')
    expect(routes.admin.reports).toBe('/admin/reports')
  })

  it('should generate dynamic member routes correctly', () => {
    expect(routes.memberDynamic.profile('user123')).toBe('/profile/user123')
    expect(routes.memberDynamic.need('need456')).toBe('/needs/need456')
    expect(routes.memberDynamic.surrogacy('surg789')).toBe('/surrogacies/surg789')
  })

  it('should not have route conflicts between surfaces', () => {
    const allRoutes = new Set([
      ...Object.values(routes.public),
      ...Object.values(routes.member),
      ...Object.values(routes.admin),
    ])

    const uniqueRoutes = new Set(allRoutes)
    expect(uniqueRoutes.size).toBe(allRoutes.size)
  })
})