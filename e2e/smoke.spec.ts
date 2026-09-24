import { mkdir } from 'node:fs/promises'
import { expect, test, type BrowserContext, type Download, type Page } from '@playwright/test'
import { provisionScreenshotAdmin } from './support/screenshotAdmin'

type TrialMember = {
  name: string
  email: string
  password: string
}

type VisualEvidenceOptions = {
  fullPage?: boolean
}

const visualEvidenceDirectory = 'docs/screenshots'
const visualEvidenceViewport = { width: 1600, height: 1000 }

async function captureVisualEvidence(page: Page, filename: string, options: VisualEvidenceOptions = {}) {
  await mkdir(visualEvidenceDirectory, { recursive: true })
  await page.setViewportSize(visualEvidenceViewport)
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await page.screenshot({
    path: `${visualEvidenceDirectory}/${filename}`,
    fullPage: options.fullPage ?? false,
    animations: 'disabled',
  })
}

async function signUp(page: Page, member: TrialMember): Promise<string> {
  await page.goto('/signup')
  await page.getByLabel('Full Name').fill(member.name)
  await page.getByLabel('Email Address').fill(member.email)
  await page.getByLabel('Password', { exact: true }).fill(member.password)
  await page.getByLabel('Confirm Password').fill(member.password)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Create Account' }).click()
  await page.waitForURL(/\/profile\//, { timeout: 20_000 })
  return page.url()
}

async function signIn(page: Page, member: TrialMember) {
  await page.goto('/login')
  await page.getByLabel('Email Address').fill(member.email)
  await page.getByLabel('Password').fill(member.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

async function createNeed(page: Page, title: string): Promise<string> {
  await page.goto('/needs/create')
  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Description').fill('I need a reliable companion for a consumer trial conversation and planning session.')
  await page.getByLabel('Timing').fill('Flexible this week')
  await page.getByLabel('Tags').fill('conversation, planning, companion')
  await page.getByRole('button', { name: 'Publish Need' }).click()
  await page.waitForURL(/\/needs\/[0-9a-f-]{36}$/i, { timeout: 20_000 })
  await expect(page.getByText(title, { exact: true })).toBeVisible()
  return page.url()
}

async function createOffer(page: Page, title: string): Promise<string> {
  await page.goto('/offers/create')
  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Description').fill('I can provide a reliable companion session for conversation, planning, and follow-through.')
  await page.getByLabel('Timing').fill('Flexible this week')
  await page.getByRole('button', { name: 'Publish Offer' }).click()
  await page.waitForURL(/\/offers\/[0-9a-f-]{36}$/i, { timeout: 20_000 })
  await expect(page.getByText(title, { exact: true })).toBeVisible()
  return page.url()
}

async function dispose(contexts: BrowserContext[]) {
  await Promise.all(contexts.map((context) => context.close()))
}

function normalizeMailText(value: string): string {
  return value
    .replace(/=\r?\n/g, '')
    .replace(/=3D/gi, '=')
    .replace(/&amp;/g, '&')
}

async function recoveryLinkFor(email: string): Promise<string> {
  const mailpitUrl = process.env.MAILPIT_URL
  if (!mailpitUrl) throw new Error('MAILPIT_URL is required for password recovery proof')

  let link = ''
  await expect.poll(async () => {
    const response = await fetch(`${mailpitUrl}/view/latest.txt?query=${encodeURIComponent(`to:${email}`)}`)
    if (!response.ok) return ''
    const text = normalizeMailText(await response.text())
    const candidates = text.match(/https?:\/\/[^\s<>"']+/g) ?? []
    link = candidates.find((candidate) => candidate.includes('/auth/v1/verify?')) ?? ''
    return link
  }, { timeout: 20_000, intervals: [250, 500, 1000] }).not.toBe('')

  return link
}

async function downloadText(download: Download): Promise<string> {
  const stream = await download.createReadStream()
  let text = ''
  for await (const chunk of stream) text += chunk.toString()
  return text
}

test.describe('Consumer trial smoke @smoke', () => {
  test('public entry surface is usable', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Surrogate Network/)
    await expect(page.locator('h1')).toContainText('Meaningful Connections')
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Join', exact: true })).toBeVisible()
    await captureVisualEvidence(page, '01-public-home.png')

    await page.goto('/how-it-works')
    await expect(page.getByRole('heading', { name: 'How It Works' })).toBeVisible()
    await captureVisualEvidence(page, '05-how-it-works.png', { fullPage: true })

    await page.goto('/safety')
    await expect(page.getByRole('heading', { name: /Safety/i })).toBeVisible()
    await captureVisualEvidence(page, '06-safety.png', { fullPage: true })
  })

  test('password recovery exchanges a real PKCE email link and changes the credential', async ({ browser }) => {
    const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    const member: TrialMember = {
      name: 'Recovery Test Member',
      email: `recovery-${runId}@test.local`,
      password: 'Recovery-Original-123!',
    }
    const newPassword = 'Recovery-Changed-456!'
    const setupContext = await browser.newContext()
    const recoveryContext = await browser.newContext()
    const loginContext = await browser.newContext()
    const contexts = [setupContext, recoveryContext, loginContext]

    try {
      await signUp(await setupContext.newPage(), member)

      const recovery = await recoveryContext.newPage()
      await recovery.goto('/forgot-password')
      await recovery.getByLabel('Email address').fill(member.email)
      await recovery.getByRole('button', { name: 'Send reset link' }).click()
      await expect(recovery.getByRole('status')).toContainText('If an account exists')

      const recoveryLink = await recoveryLinkFor(member.email)
      await recovery.goto(recoveryLink)
      await recovery.waitForURL(/\/reset-password$/, { timeout: 20_000 })
      await recovery.getByLabel('New password').fill(newPassword)
      await recovery.getByLabel('Confirm password').fill(newPassword)
      await recovery.getByRole('button', { name: 'Update password' }).click()
      await recovery.waitForURL(/\/home$/, { timeout: 20_000 })

      const login = await loginContext.newPage()
      await signIn(login, { ...member, password: newPassword })
      await login.waitForURL(/\/home$/, { timeout: 20_000 })
    } finally {
      await dispose(contexts)
    }
  })

  test('two real members complete the canonical marketplace lifecycle and expose the showcase product surfaces', async ({ browser }) => {
    const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    const memberA: TrialMember = {
      name: 'Alex Carter',
      email: `trial-provider-${runId}@test.local`,
      password: 'Consumer-Trial-A-123!',
    }
    const memberB: TrialMember = {
      name: 'Jordan Lee',
      email: `trial-requester-${runId}@test.local`,
      password: 'Consumer-Trial-B-456!',
    }
    const adminMember: TrialMember = {
      name: 'Morgan Admin',
      email: `trial-admin-${runId}@test.local`,
      password: 'Consumer-Trial-Admin-789!',
    }
    const needTitle = 'Weekly Planning Companion'
    const offerTitle = 'Conversation & Planning Support'

    const requesterContext = await browser.newContext()
    const providerContext = await browser.newContext()
    const adminContext = await browser.newContext()
    const contexts = [requesterContext, providerContext, adminContext]

    try {
      const requester = await requesterContext.newPage()
      const provider = await providerContext.newPage()
      const admin = await adminContext.newPage()

      await signUp(requester, memberB)
      const needUrl = await createNeed(requester, needTitle)
      await requester.evaluate(() => window.scrollTo(0, 0))
      await captureVisualEvidence(requester, '02-published-need.png')

      const providerProfileUrl = await signUp(provider, memberA)
      const offerUrl = await createOffer(provider, offerTitle)
      await provider.evaluate(() => window.scrollTo(0, 0))
      await captureVisualEvidence(provider, '09-published-offer.png')

      await provider.goto('/discover')
      await expect(provider.getByRole('heading', { name: 'Discover', exact: true })).toBeVisible()
      await expect(provider.getByText(needTitle, { exact: true })).toBeVisible()
      await expect(provider.getByText(offerTitle, { exact: true })).toBeVisible()
      await provider.evaluate(() => window.scrollTo(0, 0))
      await captureVisualEvidence(provider, '08-discovery-marketplace.png')

      await provider.goto(needUrl)
      const composer = provider.getByText('Make a proposal', { exact: true }).locator('..').locator('..')
      await composer.getByRole('combobox').click()
      await provider.getByRole('option', { name: offerTitle }).click()
      await composer.getByPlaceholder('Add context for the other member').fill('I can help turn your weekly priorities into a practical plan and keep the conversation focused on next steps.')
      await composer.scrollIntoViewIfNeeded()
      await provider.evaluate(() => window.scrollBy(0, -180))
      await captureVisualEvidence(provider, '10-proposal-composer.png')
      await composer.getByRole('button', { name: 'Send proposal' }).click()
      await provider.waitForURL(/\/proposals$/, { timeout: 20_000 })
      await expect(provider.getByText(`${needTitle} ↔ ${offerTitle}`, { exact: true })).toBeVisible()

      await requester.goto('/proposals')
      const incomingProposalTitle = requester.getByText(`${needTitle} ↔ ${offerTitle}`, { exact: true })
      const incomingProposal = incomingProposalTitle.locator('..').locator('..')
      await expect(incomingProposal.getByText('Incoming', { exact: true })).toBeVisible()
      await requester.evaluate(() => window.scrollTo(0, 0))
      await captureVisualEvidence(requester, '03-incoming-proposal.png')
      await incomingProposal.getByRole('button', { name: 'Accept' }).click()
      await requester.waitForURL(/\/surrogacies\/[0-9a-f-]{36}$/i, { timeout: 20_000 })
      const surrogacyUrl = requester.url()
      await expect(requester.getByText(`${needTitle} ↔ ${offerTitle}`, { exact: true })).toBeVisible()
      await requester.evaluate(() => window.scrollTo(0, 0))
      await captureVisualEvidence(requester, '12-active-surrogacy.png')

      await requester.goto('/home')
      await expect(requester.getByRole('heading', { name: 'Your network' })).toBeVisible()
      await expect(requester.getByText('Active Surrogacies')).toBeVisible()
      await requester.evaluate(() => window.scrollTo(0, 0))
      await captureVisualEvidence(requester, '07-member-dashboard.png')

      await requester.goto(providerProfileUrl)
      await expect(requester.getByRole('heading', { name: memberA.name })).toBeVisible()
      await expect(requester.getByText(offerTitle, { exact: true })).toBeVisible()
      const safetyControls = requester.getByText('Safety controls', { exact: true }).locator('..').locator('..')
      await safetyControls.getByRole('button', { name: 'Report' }).click()
      await safetyControls.getByPlaceholder('Describe what happened and include relevant context.').fill('Persistent contact after I declined an additional request.')
      await requester.evaluate(() => window.scrollTo(0, 0))
      await captureVisualEvidence(requester, '11-member-profile-safety.png', { fullPage: true })
      await safetyControls.getByRole('button', { name: 'Submit report' }).click()
      await expect(requester.getByText('Report submitted', { exact: true })).toBeVisible({ timeout: 20_000 })

      await signUp(admin, adminMember)
      await provisionScreenshotAdmin(adminMember.email)
      await admin.goto('/admin')
      await expect(admin.getByRole('heading', { name: 'Admin Console' })).toBeVisible()
      await expect(admin.getByText('Open Reports')).toBeVisible()
      await admin.evaluate(() => window.scrollTo(0, 0))
      await captureVisualEvidence(admin, '14-admin-console.png')

      await admin.goto('/admin/reports')
      await expect(admin.getByRole('heading', { name: 'Moderation Reports' })).toBeVisible()
      await expect(admin.getByText('Persistent contact after I declined an additional request.', { exact: true })).toBeVisible()
      await admin.evaluate(() => window.scrollTo(0, 0))
      await captureVisualEvidence(admin, '15-moderation-reports.png', { fullPage: true })

      await requester.goto(surrogacyUrl)
      const scheduler = requester.getByText('Schedule a Moment', { exact: true }).locator('..').locator('..')
      const momentTime = new Date(Date.now() - 5 * 60_000)
      const localDateTime = momentTime.toISOString().slice(0, 16)
      await scheduler.locator('input[type="datetime-local"]').fill(localDateTime)
      await scheduler.getByRole('spinbutton').fill('30')
      await scheduler.getByPlaceholder('Video call, coffee shop, address, etc.').fill('Video call')
      await scheduler.getByPlaceholder('Shared notes or expectations').fill('Review weekly priorities and leave with three concrete next actions.')
      await scheduler.getByRole('button', { name: 'Schedule Moment' }).click()
      await expect(requester.getByText('Moment: scheduled', { exact: true })).toBeVisible({ timeout: 20_000 })

      const momentCard = requester.getByText('Moment: scheduled', { exact: true }).locator('..').locator('..').locator('..')
      await momentCard.getByRole('button', { name: 'Complete' }).click()
      await expect(requester.getByText('Exchange: completed', { exact: true })).toBeVisible({ timeout: 20_000 })

      const feedbackTitle = requester.getByText(`Feedback for ${memberA.name}`, { exact: true })
      const feedbackCard = feedbackTitle.locator('..').locator('..')
      await feedbackCard.getByPlaceholder('Optional comments').fill('Clear, thoughtful, and easy to plan with. We left the session with concrete next steps.')
      await feedbackCard.getByPlaceholder('Skill endorsements, comma-separated').fill('communication, reliability, planning')
      await feedbackCard.getByRole('button', { name: 'Submit Feedback' }).click()
      await expect(requester.getByText('You submitted feedback for this Exchange.', { exact: true })).toBeVisible({ timeout: 20_000 })
      await requester.getByText('Moments & Exchanges', { exact: true }).scrollIntoViewIfNeeded()
      await requester.evaluate(() => window.scrollBy(0, -260))
      await captureVisualEvidence(requester, '04-completed-exchange.png')

      await provider.goto('/surrogacies')
      await expect(provider.getByText(`${needTitle} ↔ ${offerTitle}`, { exact: true })).toBeVisible()

      await provider.goto('/settings')
      await expect(provider.getByRole('link', { name: 'Download my data' })).toBeVisible()
      await expect(provider.getByRole('button', { name: 'Delete account' })).toBeVisible()
      await provider.getByText('Safety & privacy', { exact: true }).scrollIntoViewIfNeeded()
      await provider.evaluate(() => window.scrollBy(0, -120))
      await captureVisualEvidence(provider, '13-account-privacy-controls.png')

      const downloadPromise = provider.waitForEvent('download')
      await provider.getByRole('link', { name: 'Download my data' }).click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/^surrogate-network-export-\d{4}-\d{2}-\d{2}\.json$/)
      const exported = JSON.parse(await downloadText(download)) as {
        account: { email: string | null }
        surrogacies: Array<{ id: string }>
        offers: Array<{ title: string }>
      }
      expect(exported.account.email).toBe(memberA.email)
      expect(exported.surrogacies.length).toBeGreaterThan(0)
      expect(exported.offers.some((offer) => offer.title === offerTitle)).toBe(true)

      await provider.goto(offerUrl)
      await expect(provider.getByText(offerTitle, { exact: true })).toBeVisible()

      await provider.goto('/settings')
      await provider.getByRole('button', { name: 'Delete account' }).click()
      await provider.getByLabel('Current password').fill(memberA.password)
      await provider.getByLabel('Type DELETE to confirm').fill('DELETE')
      await provider.getByRole('button', { name: 'Permanently delete account' }).click()
      await provider.waitForURL(/\/account-deleted(?:\?auth=pending)?$/, { timeout: 20_000 })
      await expect(provider.getByRole('heading', { name: 'Account deleted' })).toBeVisible()

      await signIn(provider, memberA)
      await expect(provider.getByRole('alert')).toBeVisible({ timeout: 20_000 })
      await expect(provider).toHaveURL(/\/login$/)

      await requester.goto(surrogacyUrl)
      await expect(requester.getByText(`${needTitle} ↔ Deleted member offer`, { exact: true })).toBeVisible()
      await expect(requester.getByText('Exchange: completed', { exact: true })).toBeVisible()
    } finally {
      await dispose(contexts)
    }
  })

  test('unknown routes return a real 404', async ({ page }) => {
    const response = await page.goto('/non-existent-consumer-trial-route')
    expect(response?.status()).toBe(404)
  })
})
