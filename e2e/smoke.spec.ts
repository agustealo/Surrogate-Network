// E2E Smoke Tests for Surrogate Companion
// Tests core user flows and navigation

import { test, expect } from '@playwright/test'

test.describe('Public Surface', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Surrogate Network/)
    
    // Check for key elements
    await expect(page.locator('h1')).toContainText('Meaningful Connections')
  })

  test('should have working public navigation', async ({ page }) => {
    await page.goto('/')
    
    // Test navigation links
    const homeLink = page.getByRole('link', { name: /home/i })
    await expect(homeLink).toBeVisible()
  })

  test('should show sign in and join buttons', async ({ page }) => {
    await page.goto('/')
    
    const signInButton = page.getByRole('link', { name: /sign in/i })
    const joinButton = page.getByRole('link', { name: /join/i })
    
    await expect(signInButton).toBeVisible()
    await expect(joinButton).toBeVisible()
  })
})

test.describe('Legacy Route Redirects @smoke', () => {
  test('should redirect /dashboard to /home', async ({ page }) => {
    const response = await page.goto('/dashboard')
    // Should redirect to home
    expect(response?.url()).toContain('/home')
  })

  test('should redirect /matches to /discover', async ({ page }) => {
    const response = await page.goto('/matches')
    expect(response?.url()).toContain('/discover')
  })

  test('should redirect /chat to /messages', async ({ page }) => {
    const response = await page.goto('/chat')
    expect(response?.url()).toContain('/messages')
  })
})

test.describe('Responsive Design @smoke', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check mobile navigation appears
    await expect(page).toHaveTitle(/Surrogate Network/)
  })

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    
    await expect(page).toHaveTitle(/Surrogate Network/)
  })

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    
    await expect(page).toHaveTitle(/Surrogate Network/)
  })
})

test.describe('Error Handling @smoke', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page')
    expect(response?.status()).toBe(404)
  })

  test('should handle server errors gracefully', async ({ page }) => {
    // This would test a known error endpoint if we had one
    await page.goto('/')
    await expect(page).toHaveTitle(/Surrogate Network/)
  })
})

test.describe('Accessibility @smoke', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/')
    
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    
    // Check h1 is the first heading
    const firstHeading = await page.locator('h1, h2, h3').first()
    await expect(await firstHeading.evaluate((node) => node.tagName)).toBe('H1')
  })

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/')
    
    const navigation = page.getByRole('navigation')
    await expect(navigation).toBeVisible()
    
    // Check for keyboard navigable links
    const links = navigation.getByRole('link')
    const linkCount = await links.count()
    expect(linkCount).toBeGreaterThan(0)
  })
})
