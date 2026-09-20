import { expect, test, type BrowserContext, type Page } from '@playwright/test'

type TrialMember = {
  name: string
  email: string
  password: string
}

async function signUp(page: Page, member: TrialMember) {
  await page.goto('/signup')
  await page.getByLabel('Full Name').fill(member.name)
  await page.getByLabel('Email Address').fill(member.email)
  await page.getByLabel('Password', { exact: true }).fill(member.password)
  await page.getByLabel('Confirm Password').fill(member.password)
  await page.getByRole('button', { name: 'Create Account' }).click()
  await page.waitForURL(/\/profile\//, { timeout: 20_000 })
}

async function createNeed(page: Page, title: string): Promise<string> {
  await page.goto('/needs/create')
  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Description').fill('I need a reliable companion for a consumer trial conversation and planning session.')
  await page.getByLabel('Timing').fill('Flexible this week')
  await page.getByLabel('Tags').fill('conversation, planning, companion')
  await page.getByRole('button', { name: 'Publish Need' }).click()
  await page.waitForURL(/\/needs\/[0-9a-f-]{36}$/i, { timeout: 20_000 })
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  return page.url()
}

async function createOffer(page: Page, title: string): Promise<string> {
  await page.goto('/offers/create')
  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Description').fill('I can provide a reliable companion session for conversation, planning, and follow-through.')
  await page.getByLabel('Timing').fill('Flexible this week')
  await page.getByRole('button', { name: 'Publish Offer' }).click()
  await page.waitForURL(/\/offers\/[0-9a-f-]{36}$/i, { timeout: 20_000 })
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  return page.url()
}

async function dispose(contexts: BrowserContext[]) {
  await Promise.all(contexts.map((context) => context.close()))
}

test.describe('Consumer trial smoke @smoke', () => {
  test('public entry surface is usable', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Surrogate Network/)
    await expect(page.locator('h1')).toContainText('Meaningful Connections')
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /join/i })).toBeVisible()
  })

  test('two real members can complete the canonical marketplace lifecycle', async ({ browser }) => {
    const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    const memberA: TrialMember = {
      name: `Trial Provider ${runId}`,
      email: `trial-provider-${runId}@test.local`,
      password: 'Consumer-Trial-A-123!',
    }
    const memberB: TrialMember = {
      name: `Trial Requester ${runId}`,
      email: `trial-requester-${runId}@test.local`,
      password: 'Consumer-Trial-B-456!',
    }
    const needTitle = `Trial Need ${runId}`
    const offerTitle = `Trial Offer ${runId}`

    const requesterContext = await browser.newContext()
    const providerContext = await browser.newContext()
    const contexts = [requesterContext, providerContext]

    try {
      const requester = await requesterContext.newPage()
      const provider = await providerContext.newPage()

      await signUp(requester, memberB)
      const needUrl = await createNeed(requester, needTitle)

      await signUp(provider, memberA)
      await createOffer(provider, offerTitle)

      await provider.goto(needUrl)
      const composer = provider.getByRole('heading', { name: 'Make a proposal' }).locator('..').locator('..')
      await composer.getByRole('combobox').click()
      await provider.getByRole('option', { name: offerTitle }).click()
      await composer.getByPlaceholder('Add context for the other member').fill('Consumer trial proposal with explicit persisted terms.')
      await composer.getByRole('button', { name: 'Send proposal' }).click()
      await provider.waitForURL(/\/proposals$/, { timeout: 20_000 })
      await expect(provider.getByText(`${needTitle} ↔ ${offerTitle}`)).toBeVisible()

      await requester.goto('/proposals')
      const incomingProposal = requester.getByText(`${needTitle} ↔ ${offerTitle}`).locator('..').locator('..').locator('..')
      await expect(incomingProposal.getByText('Incoming')).toBeVisible()
      await incomingProposal.getByRole('button', { name: 'Accept' }).click()
      await requester.waitForURL(/\/surrogacies\/[0-9a-f-]{36}$/i, { timeout: 20_000 })
      await expect(requester.getByText(`${needTitle} ↔ ${offerTitle}`)).toBeVisible()

      const scheduler = requester.getByRole('heading', { name: 'Schedule a Moment' }).locator('..').locator('..')
      const momentTime = new Date(Date.now() - 5 * 60_000)
      const localDateTime = momentTime.toISOString().slice(0, 16)
      await scheduler.locator('input[type="datetime-local"]').fill(localDateTime)
      await scheduler.getByRole('spinbutton').fill('30')
      await scheduler.getByPlaceholder('Video call, coffee shop, address, etc.').fill('Video call')
      await scheduler.getByPlaceholder('Shared notes or expectations').fill('Consumer trial exchange proof.')
      await scheduler.getByRole('button', { name: 'Schedule Moment' }).click()
      await expect(requester.getByText('Moment: scheduled')).toBeVisible({ timeout: 20_000 })

      const momentCard = requester.getByText('Moment: scheduled').locator('..').locator('..').locator('..')
      await momentCard.getByRole('button', { name: 'Complete' }).click()
      await expect(requester.getByText('Exchange: completed')).toBeVisible({ timeout: 20_000 })

      const feedbackHeading = requester.getByRole('heading', { name: new RegExp(`Feedback for ${memberA.name}`) })
      const feedbackCard = feedbackHeading.locator('..').locator('..')
      await feedbackCard.getByPlaceholder('Optional comments').fill('Completed successfully during the consumer-trial E2E proof.')
      await feedbackCard.getByPlaceholder('Skill endorsements, comma-separated').fill('communication, reliability')
      await feedbackCard.getByRole('button', { name: 'Submit Feedback' }).click()
      await expect(requester.getByText('You submitted feedback for this Exchange.')).toBeVisible({ timeout: 20_000 })

      await provider.goto('/surrogacies')
      await expect(provider.getByText(`${needTitle} ↔ ${offerTitle}`)).toBeVisible()
    } finally {
      await dispose(contexts)
    }
  })

  test('unknown routes return a real 404', async ({ page }) => {
    const response = await page.goto('/non-existent-consumer-trial-route')
    expect(response?.status()).toBe(404)
  })
})
