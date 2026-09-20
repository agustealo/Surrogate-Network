import { expect, test } from '@playwright/test'

test.describe('Consumer accessibility smoke @a11y', () => {
  test('public navigation exposes semantic landmarks and heading order', async ({ page }) => {
    await page.goto('/')

    const navigation = page.getByRole('navigation', { name: 'Primary navigation' })
    await expect(navigation).toBeVisible()
    await expect(navigation.getByRole('link').first()).toBeVisible()

    const firstHeading = page.locator('h1, h2, h3').first()
    expect(await firstHeading.evaluate((element) => element.tagName)).toBe('H1')
  })

  test('public navigation remains keyboard reachable with visible focus', async ({ page }) => {
    await page.goto('/')

    const firstLink = page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link').first()
    await firstLink.focus()
    await expect(firstLink).toBeFocused()

    const focusVisible = await firstLink.evaluate((element) => {
      const style = window.getComputedStyle(element)
      return style.outlineStyle !== 'none' || style.boxShadow !== 'none'
    })
    expect(focusVisible).toBe(true)
  })

  test('login fields have programmatic labels', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByLabel('Email Address')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()

    const inputs = page.locator('form input')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(0)

    for (let index = 0; index < count; index += 1) {
      const labelled = await inputs.nth(index).evaluate((element: HTMLInputElement) =>
        element.labels.length > 0 || element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby')
      )
      expect(labelled).toBe(true)
    }
  })

  test('invalid login submission exposes announced validation state', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible()
    await expect(page.locator('[role="alert"]').first()).toBeVisible()
  })

  test('responsive public surface preserves semantic mobile navigation and primary heading', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    await expect(page.locator('h1').first()).toBeVisible()
    const mobileNavigation = page.getByRole('navigation', { name: 'Mobile primary navigation' })
    await expect(mobileNavigation).toBeVisible()
    await expect(mobileNavigation.getByRole('link', { name: 'Home', exact: true })).toBeVisible()
  })
})
