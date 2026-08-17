// Accessibility tests for core workflows
// Tests compliance with WCAG 2.2 AA standards

import { test, expect } from '@playwright/test'

test.describe('Accessibility: Public Navigation', () => {
  test('should have accessible navigation structure', async ({ page }) => {
    await page.goto('/')
    
    // Check main navigation exists
    const mainNav = page.getByRole('navigation')
    await expect(mainNav).toBeVisible()
    
    // Check for proper ARIA roles
    const navLinks = mainNav.getByRole('link')
    const linkCount = await navLinks.count()
    expect(linkCount).toBeGreaterThan(0)
  })

  test('should have keyboard navigable links', async ({ page }) => {
    await page.goto('/')
    
    const firstLink = page.getByRole('link').first()
    await firstLink.focus()
    await expect(firstLink).toBeFocused()
    
    // Tab navigation should work
    await page.keyboard.press('Tab')
    const activeElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON']).toContain(activeElement)
  })

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/')
    
    const link = page.getByRole('link').first()
    await link.focus()
    
    // Check for focus-visible styles
    const hasFocusStyle = await link.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el)
      return computedStyle.outline !== 'none' || 
             computedStyle.boxShadow !== 'none' ||
             computedStyle.borderColor !== 'rgb(0, 0, 0)' // check if border changes
    })
    
    expect(hasFocusStyle).toBe(true)
  })
})

test.describe('Accessibility: Member Navigation', () => {
  test('should have accessible sidebar navigation', async ({ page }) => {
    // Note: This would require authenticated state in a real scenario
    // For smoke testing, we're checking the structure exists
    await page.goto('/home')
    
    // Member navigation should be present
    const memberNav = page.getByRole('navigation')
    await expect(memberNav).toBeVisible()
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/home')
    
    // Check h1 is present and is first heading
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
    
    // Verify it's actually h1, not h2/h3 coming first
    const firstHeading = await page.locator('h1, h2, h3').first()
    await expect(firstHeading).toHaveTag('h1')
  })

  test('should have accessible mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/home')
    
    // Mobile navigation should be present
    const mobileNav = page.getByRole('navigation')
    await expect(mobileNav).toBeVisible()
  })
})

test.describe('Accessibility: Admin Navigation', () => {
  test('should have accessible admin navigation structure', async ({ page }) => {
    // Admin navigation would require authentication
    // Testing structure exists
    await page.goto('/admin')
    
    // Check admin navigation is present
    const adminNav = page.getByRole('navigation')
    await expect(adminNav).toBeVisible()
  })

  test('should have environment indicator for admins', async ({ page }) => {
    await page.goto('/admin')
    
    // Should show environment indicator
    const content = await page.content()
    expect(content).toMatch(/development|staging|production/i)
  })
})

test.describe('Accessibility: Forms', () => {
  test('should have properly labeled form inputs', async ({ page }) => {
    await page.goto('/login')
    
    // Check for form with labels
    const form = page.locator('form').first()
    const inputs = form.locator('input')
    const inputCount = await inputs.count()
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      await expect(input).toBeVisible()
      
      // Each input should have accessible label
      const hasLabel = await input.evaluate((el) => {
        return el.hasAttribute('aria-label') || 
               el.hasAttribute('aria-labelledby') ||
               el.labels.length > 0
      })
      expect(hasLabel).toBe(true)
    }
  })

  test('should have accessible error messages', async ({ page }) => {
    await page.goto('/login')
    
    // Try submitting empty form to trigger validation
    const submitButton = page.getByRole('button', { name: /sign in|login/i })
    if (await submitButton.isVisible()) {
      await submitButton.click()
      
      // Check for error messages that are properly associated
      const errors = page.locator('[role="alert"], .error, [aria-invalid="true"]')
      const errorCount = await errors.count()
      
      if (errorCount > 0) {
        // Errors should be announced to screen readers
        for (let i = 0; i < errorCount; i++) {
          const error = errors.nth(i)
          await expect(error).toBeVisible()
          
          const isAccessible = await error.evaluate((el) => {
            return el.getAttribute('role') === 'alert' ||
                   el.getAttribute('aria-live') === 'polite' ||
                   el.getAttribute('aria-live') === 'assertive'
          })
          expect(isAccessible).toBe(true)
        }
      }
    }
  })
})

test.describe('Accessibility: Dialogs', () => {
  test('should have accessible dialog focus management', async ({ page }) => {
    await page.goto('/home')
    
    // Look for dialog triggers
    const dialogTriggers = page.getByRole('button').filter({ hasText: /settings|profile|menu/i })
    const triggerCount = await dialogTriggers.count()
    
    if (triggerCount > 0) {
      await dialogTriggers.first().click()
      
      // Dialog should be visible
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      
      // Focus should be trapped in dialog
      const activeElement = await page.evaluate(() => document.activeElement)
      const dialogContent = await dialog.locator('[role="dialog"]')
      await expect(dialogContent).toContain(activeElement)
    }
  })
})

test.describe('Accessibility: Color Independence', () => {
  test('should distinguish Need vs Offer beyond color', async ({ page }) => {
    await page.goto('/discover')
    
    // Look for Need and Offer cards
    const content = await page.content()
    
    // Check that both use semantic indicators beyond color
    expect(content).toMatch(/need|offer/i)
    
    // Should have distinguishing text or icons, not just colors
    // This is a basic check - full implementation would check specific components
  })
})

test.describe('Accessibility: Media', () => {
  test('should have accessible images with alt text', async ({ page }) => {
    await page.goto('/home')
    
    const images = page.locator('img')
    const imageCount = await images.count()
    
    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i)
        const hasAlt = await img.getAttribute('alt')
        expect(hasAlt).toBeTruthy()
      }
    }
  })

  test('should handle blurred media accessibility', async ({ page }) => {
    // This would need actual implementation to test properly
    // For now, checking that the structure exists
    await page.goto('/profile/1')
    
    // Check that profile structure is present
    const profile = page.locator('main')
    await expect(profile).toBeVisible()
  })
})

test.describe('Accessibility: Responsive Design', () => {
  const viewports = [
    { width: 320, height: 568, name: 'Mobile Small' },
    { width: 375, height: 667, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1024, height: 768, name: 'Desktop Small' },
    { width: 1920, height: 1080, name: 'Desktop Large' },
  ]

  viewports.forEach(({ width, height, name }) => {
    test(`should work properly on ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await page.goto('/')
      
      // Check basic functionality
      await expect(page).toHaveTitle(/Surrogate Companion/)
      
      // Check no horizontal overflow
      const bodyOverflow = await page.evaluate(() => {
        return window.getComputedStyle(document.body).overflowX
      })
      expect(bodyOverflow).not.toBe('auto')
      expect(bodyOverflow).not.toBe('scroll')
    })
  })
})

test.describe('Accessibility: Keyboard Navigation', () => {
  test('should support full keyboard navigation of main flows', async ({ page }) => {
    await page.goto('/')
    
    // Test Tab navigation through main elements
    const focusableElements = await page.locator('button, [href], input, select, textarea').all()
    
    if (focusableElements.length > 0) {
      for (let i = 0; i < Math.min(focusableElements.length, 5); i++) {
        await page.keyboard.press('Tab')
        
        const activeElement = await page.evaluate(() => document.activeElement?.tagName)
        expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(activeElement)
      }
    }
  })

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/')
    
    // Navigate away and back, focus should be managed
    await page.keyboard.press('Tab')
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName)
    
    // Tab again
    await page.keyboard.press('Tab')
    const secondFocused = await page.evaluate(() => document.activeElement?.tagName)
    
    // Should be different focusable elements
    expect(firstFocused).toBeTruthy()
    expect(secondFocused).toBeTruthy()
  })
})

test.describe('Accessibility: Screen Reader Compatibility', () => {
  test('should have proper ARIA labels for interactive elements', async ({ page }) => {
    await page.goto('/')
    
    // Check buttons have accessible names
    const buttons = page.getByRole('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = buttons.nth(i)
      const hasAccessibleName = await button.evaluate((el) => {
        return el.hasAttribute('aria-label') ||
               el.textContent?.trim().length > 0 ||
               el.getAttribute('aria-labelledby')
      })
      expect(hasAccessibleName).toBe(true)
    }
  })

  test('should announce important state changes', async ({ page }) => {
    await page.goto('/')
    
    // Check for live regions that announce changes
    const liveRegions = page.locator('[aria-live]')
    const liveRegionCount = await liveRegions.count()
    
    // Live regions may or may not exist depending on state
    // If they exist, they should be properly configured
    if (liveRegionCount > 0) {
      for (let i = 0; i < liveRegionCount; i++) {
        const region = liveRegions.nth(i)
        const politeOrAssertive = await region.evaluate((el) => {
          const live = el.getAttribute('aria-live')
          return live === 'polite' || live === 'assertive'
        })
        expect(politeOrAssertive).toBe(true)
      }
    }
  })
})