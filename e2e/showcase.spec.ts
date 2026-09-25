import { mkdir } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'

const visualEvidenceDirectory = 'docs/screenshots'
const visualEvidenceViewport = { width: 1600, height: 1000 }

async function captureShowcase(page: Page, filename: string) {
  await mkdir(visualEvidenceDirectory, { recursive: true })
  await page.setViewportSize(visualEvidenceViewport)
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await page.screenshot({
    path: `${visualEvidenceDirectory}/${filename}`,
    fullPage: true,
    animations: 'disabled',
  })
}

test.describe('Documentation showcase @smoke', () => {
  test('community principles are publication-ready', async ({ page }) => {
    await page.goto('/principles')
    await expect(page.getByRole('heading', { name: 'Our Co-op Charter' })).toBeVisible()
    await expect(page.getByText('The Principles of Connection', { exact: true })).toBeVisible()
    await expect(page.getByText('Safety & Respect', { exact: true })).toBeVisible()
    await expect(page.getByText('Transparency & Honesty', { exact: true })).toBeVisible()
    await expect(page.getByText('Mutuality & Reciprocity', { exact: true })).toBeVisible()
    await captureShowcase(page, '16-community-principles.png')
  })
})
