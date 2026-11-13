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

function normalizeMailText(value: string): string {
  return value
    .replace(/=\r?\n/g, '')
    .replace(/=3D/gi, '=')
    .replace(/&amp;/g, '&')
}

async function mailLinkFor(email: string, predicate: (candidate: string) => boolean, proofName: string): Promise<string> {
  const mailpitUrl = process.env.MAILPIT_URL
  if (!mailpitUrl) throw new Error(`MAILPIT_URL is required for ${proofName}`)

  let link = ''
  await expect.poll(async () => {
    const response = await fetch(`${mailpitUrl}/view/latest.txt?query=${encodeURIComponent(`to:${email}`)}`)
    if (!response.ok) return ''
    const text = normalizeMailText(await response.text())
    const candidates = text.match(/https?:\/\/[^\s<>"']+/g) ?? []
    link = candidates.find(predicate) ?? ''
    return link
  }, { timeout: 20_000, intervals: [250, 500, 1000] }).not.toBe('')

  return link
}

async function confirmationLinkFor(email: string): Promise<string> {
  return mailLinkFor(
    email,
    (candidate) => candidate.includes('/auth/confirm?') && candidate.includes('token_hash='),
    'signup email confirmation proof',
  )
}

async function recoveryLinkFor(email: string): Promise<string> {
  return mailLinkFor(
    email,
    (candidate) => candidate.includes('/auth/v1/verify?'),
    'password recovery proof',
  )
}

async function signUp(page: Page, member: TrialMember) {
  await page.goto('/signup')
  await page.getByLabel('Full Name').fill(member.name)
  await page.getByLabel('Email Address').fill(member.email)
  await page.getByLabel('Password', { exact: true }).fill(member.password)
  await page.getByLabel('Confirm Password').fill(member.password)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Create Account' }).click()
  await expect(page.getByText('Check your email', { exact: true })).toBeVisible({ timeout: 20_000 })

  const confirmationLink = await confirmationLinkFor(member.email)
  await page.goto(confirmationLink)
  await page.waitForURL(/\/profile\/create$/, { timeout: 20_000 })
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
  await Promise.allSettled(contexts.map((context) => context.close()))
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

  test('password recovery exchanges a real PKCE email link, invalidates the old credential, and accepts the replacement', async ({ browser }) => {
    const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    const member: TrialMember = {
      name: 'Recovery Test Member',
      email: `recovery-${runId}@test.local`,
      password: 'Recovery-Original-123!',
    }
    const newPassword = 'Recovery-Changed-456!'
    const setupContext = await browser.newContext()
    const recoveryContext = await browser.newContext()
    const oldCredentialContext = await browser.newContext()
    const newCredentialContext = await browser.newContext()
    const contexts = [setupContext, recoveryContext, oldCredentialContext, newCredentialContext]

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

      const oldCredentialLogin = await oldCredentialContext.newPage()
      await signIn(oldCredentialLogin, member)
      await expect(oldCredentialLogin.getByText('Invalid login credentials', { exact: true })).toBeVisible({ timeout: 20_000 })
      await expect(oldCredentialLogin).toHaveURL(/\/login$/)

      const newCredentialLogin = await newCredentialContext.newPage()
      await signIn(newCredentialLogin, { ...member, password: newPassword })
      await newCredentialLogin.waitForURL(/\/home$/, { timeout: 20_000 })
    } finally {
      await dispose(contexts)
    }
  })

  test('two real members complete the canonical marketplace lifecycle and expose the showcase product surfaces', async ({ browser }) => {
    test.setTimeout(320_000)

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
    const reportDescription = `Persistent contact after I declined an additional request. Reference ${runId}`

    const requesterContext = await browser.newContext()
    const providerContext = await browser.newContext()
    const adminContext = await browser.newContext()
    const appealAdminContext = await browser.newContext()
    const contexts = [requesterContext, providerContext, adminContext, appealAdminContext]

    try {
      const requester = await requesterContext.newPage()
      const provider = await providerContext.newPage()
      const admin = await adminContext.newPage()
      const appealAdmin = await appealAdminContext.newPage()

      await signUp(requester, memberB)
      await expect(requester.getByRole('heading', { name: /Welcome/ })).toBeVisible()
      await expect(requester.getByRole('link', { name: 'Share a Need' })).toHaveAttribute('href', '/needs/create')
      await expect(requester.getByRole('link', { name: 'Create an Offer' })).toHaveAttribute('href', '/offers/create')
      await expect(requester.getByRole('link', { name: 'Explore connections' })).toHaveAttribute('href', '/discover')
      await expect(requester.getByRole('heading', { name: 'What happens after your first step?' })).toBeVisible()
      await expect(requester.getByRole('heading', { name: 'Your comfort and boundaries come first' })).toBeVisible()
      await expect(requester.getByRole('link', { name: 'Read safety guidance' })).toHaveAttribute('href', '/safety')
      await expect(requester.getByRole('link', { name: 'Manage blocked members' })).toHaveAttribute('href', '/settings/blocked')
      await expect(requester.getByText('Looking at a listing does not create a commitment.', { exact: false })).toBeVisible()

      await requester.setViewportSize({ width: 375, height: 812 })
      const mobileNav = requester.getByRole('navigation', { name: 'Member mobile navigation' })
      await expect(mobileNav).toBeVisible()
      const mobileCreate = mobileNav.getByRole('button', { name: 'Create' })
      await mobileCreate.click()
      await expect(mobileCreate).toHaveAttribute('aria-expanded', 'true')
      await expect(mobileNav.getByRole('link', { name: 'Need', exact: true })).toHaveAttribute('href', '/needs/create')
      await expect(mobileNav.getByRole('link', { name: 'Offer', exact: true })).toHaveAttribute('href', '/offers/create')
      await requester.keyboard.press('Escape')
      await expect(mobileCreate).toHaveAttribute('aria-expanded', 'false')
      await expect(mobileCreate).toBeFocused()
      await requester.setViewportSize({ width: 1600, height: 1000 })

      const needUrl = await createNeed(requester, needTitle)
      await requester.evaluate(() => window.scrollTo(0, 0))
      await captureVisualEvidence(requester, '02-published-need.png')

      await signUp(provider, memberA)
      const offerUrl = await createOffer(provider, offerTitle)
      await provider.evaluate(() => window.scrollTo(0, 0))
      await captureVisualEvidence(provider, '09-published-offer.png')

      await provider.goto('/profile')
      await provider.waitForURL(/\/profile\/[0-9a-f-]{36}$/i, { timeout: 20_000 })
      const providerProfileUrl = provider.url()

      await provider.goto('/discover')
      await expect(provider.getByRole('heading', { name: 'Discover', exact: true })).toBeVisible()
      await expect(provider.locator(`a[href="${new URL(needUrl).pathname}"]`, { hasText: 'View Need' })).toBeVisible()
      await expect(provider.locator(`a[href="${new URL(offerUrl).pathname}"]`, { hasText: 'View Offer' })).toBeVisible()
      await provider.evaluate(() => window.scrollTo(0, 0))
      await captureVisualEvidence(provider, '08-discovery-marketplace.png')

      // Persisted recommendation preferences must survive navigation and affect the real feed.
      const recommendedNeedId = new URL(needUrl).pathname.split('/').pop()
      const needRecommendation = () => provider.locator(`[data-recommendation-key="need:${recommendedNeedId}"]`)
      const saveControl = needRecommendation().getByRole('button', { name: 'Save', exact: true })
      await saveControl.click()
      // The preference projection is the durable source of truth, not a transient toast.
      // Wait for the client mutation to settle before navigating away.
      await expect(needRecommendation().getByRole('button', { name: 'Saved', exact: true })).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 })

      await provider.goto('/discover/preferences')
      await expect(provider.getByRole('heading', { name: 'Recommendation preferences' })).toBeVisible()
      const savedSection = provider.getByRole('region', { name: 'Saved' })
      await expect(savedSection.getByText(needTitle, { exact: true })).toBeVisible()
      await savedSection.getByRole('button', { name: 'Remove saved' }).click()
      await expect(savedSection.getByText(needTitle, { exact: true })).toHaveCount(0)

      await provider.goto('/discover')
      await needRecommendation().getByRole('button', { name: 'Hide from Discover' }).click()
      await expect(needRecommendation()).toHaveCount(0)
      await provider.goto('/discover/preferences')
      const hiddenSection = provider.getByRole('region', { name: 'Hidden' })
      await expect(hiddenSection.getByText(needTitle, { exact: true })).toBeVisible()
      await hiddenSection.getByRole('button', { name: 'Show again' }).click()
      await expect(hiddenSection.getByText(needTitle, { exact: true })).toHaveCount(0)

      await provider.goto('/discover')
      await expect(needRecommendation()).toBeVisible()

      await provider.goto(needUrl)
      const composer = provider.getByText('Make a proposal', { exact: true }).locator('..').locator('..')
      await composer.getByRole('combobox').click()
      await provider.getByRole('option', { name: offerTitle }).click()
      await composer.getByRole('textbox', { name: 'Message (optional)' }).fill('I can help turn your weekly priorities into a practical plan and keep the conversation focused on next steps.')
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
      const reviewDecision = incomingProposal.getByRole('region', { name: 'Review proposal decision' })
      await expect(reviewDecision.getByText('Accept this proposal?')).toBeVisible()
      await expect(requester).toHaveURL(/\/proposals(?:\?.*)?$/)
      await reviewDecision.getByRole('button', { name: 'Confirm acceptance' }).click()
      await requester.waitForURL(/\/surrogacies\/[0-9a-f-]{36}$/i, { timeout: 20_000 })
      const surrogacyUrl = requester.url()
      await expect(requester.getByText(`${needTitle} ↔ ${offerTitle}`, { exact: true })).toBeVisible()
      await requester.evaluate(() => window.scrollTo(0, 0))
      await captureVisualEvidence(requester, '12-active-surrogacy.png')

      await requester.goto('/home')
      await expect(requester.getByRole('heading', { name: 'Your network' })).toBeVisible()
      const activeConnectionsCard = requester.getByText('Active Connections', { exact: true }).locator('..').locator('..')
      await expect(activeConnectionsCard.getByText('1', { exact: true })).toBeVisible()
      await expect(activeConnectionsCard.getByRole('link', { name: 'View' })).toHaveAttribute('href', '/surrogacies')
      await requester.evaluate(() => window.scrollTo(0, 0))
      await captureVisualEvidence(requester, '07-member-dashboard.png')

      await requester.goto(providerProfileUrl)
      await expect(requester.locator('h1', { hasText: memberA.name })).toBeVisible()
      await expect(requester.getByText(offerTitle, { exact: true })).toBeVisible()
      const safetyControls = requester.getByText('Safety controls', { exact: true }).locator('..').locator('..')
      await safetyControls.getByRole('button', { name: 'Report' }).click()
      await safetyControls.getByPlaceholder('Describe what happened and include relevant context.').fill(reportDescription)
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
      await expect(admin.getByText(reportDescription, { exact: true })).toBeVisible()
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
      await expect(requester.getByText('Outcome reported: completed', { exact: true }))
        .toBeVisible({ timeout: 20_000 })
      await expect(requester.getByText('Awaiting peer confirmation', { exact: true })).toBeVisible()
      await expect(requester.getByText(`Feedback for ${memberA.name}`, { exact: true })).toHaveCount(0)

      await provider.goto(surrogacyUrl)
      await expect(provider.getByRole('button', { name: 'Confirm outcome' })).toBeVisible()
      await provider.getByRole('button', { name: 'Confirm outcome' }).click()
      await expect(provider.getByText('Confirmed by both participants', { exact: true }))
        .toBeVisible({ timeout: 20_000 })

      await requester.reload()
      await expect(requester.getByText('Exchange: completed', { exact: true })).toBeVisible()
      await expect(requester.getByText('Confirmed by both participants', { exact: true })).toBeVisible()

      const feedbackTitle = requester.getByText(`Feedback for ${memberA.name}`, { exact: true })
      const feedbackCard = feedbackTitle.locator('..').locator('..')
      await feedbackCard.getByPlaceholder('Optional comments').fill('Clear, thoughtful, and easy to plan with. We left the session with concrete next steps.')
      await feedbackCard.getByPlaceholder('Skill endorsements, comma-separated').fill('communication, reliability, planning')
      await feedbackCard.getByRole('button', { name: 'Submit Feedback' }).click()
      await expect(requester.getByText('You submitted feedback for this Exchange.', { exact: true })).toBeVisible({ timeout: 20_000 })
      await requester.getByText('Moments & Exchanges', { exact: true }).scrollIntoViewIfNeeded()
      await requester.evaluate(() => window.scrollBy(0, -260))
      await captureVisualEvidence(requester, '04-completed-exchange.png')

      await requester.goto('/rewards')
      await expect(requester.getByRole('heading', { name: 'Rewards & Progression' })).toBeVisible()
      await expect(requester.getByText('10 XP', { exact: true })).toBeVisible()
      await expect(requester.getByText('Next rank at 100 XP', { exact: true })).toBeVisible()
      await expect(requester.getByText('+10', { exact: true })).toBeVisible()
      await expect(requester.getByRole('heading', { name: 'Achievement gallery' })).toBeVisible()
      await expect(requester.getByLabel('First Reflection: Earned')).toBeVisible()
      await expect(requester.getByLabel('Thoughtful Participant: Not earned')).toBeVisible()

      await admin.goto('/admin/achievements')
      await expect(admin.getByRole('heading', { name: 'Achievement governance' })).toBeVisible()
      await admin.locator('#achievement-reason-first_reflection')
        .fill('Review new awards without removing recognition already earned')
      await admin.getByRole('button', { name: 'Pause first_reflection achievement awards' }).click()
      await expect(admin.getByRole('button', { name: 'Resume first_reflection achievement awards' }))
        .toBeVisible({ timeout: 20_000 })

      await requester.reload()
      await expect(requester.getByLabel('First Reflection: Earned')).toBeVisible()

      await admin.locator('#achievement-reason-first_reflection')
        .fill('Policy review finished and award issuance may resume')
      await admin.getByRole('button', { name: 'Resume first_reflection achievement awards' }).click()
      await expect(admin.getByRole('button', { name: 'Pause first_reflection achievement awards' }))
        .toBeVisible({ timeout: 20_000 })

      const independentAdminMember: TrialMember = {
        name: 'Taylor Appeal Reviewer',
        email: `trial-appeal-reviewer-${runId}@test.local`,
        password: 'Consumer-Trial-Appeal-321!',
      }
      await signUp(appealAdmin, independentAdminMember)
      await provisionScreenshotAdmin(independentAdminMember.email)


      // Reward review must use real Feedback evidence, independently
      // reverse a nonmonetary journal entry and restore after a second
      // reviewer accepts the affected member's appeal.
      await provider.goto(surrogacyUrl)
      await expect(provider.getByRole('heading', { name: "Question this Feedback's reward eligibility" }))
        .toBeVisible({ timeout: 20_000 })
      const rewardReviewReason = `Please verify this credited Feedback against the recorded participants and session context. Reference ${runId}.`
      await provider.getByLabel('Evidence and reasoning').fill(rewardReviewReason)
      await provider.getByRole('button', { name: 'Submit evidence review request' }).click()
      await expect(provider.getByText('Reward review request:', { exact: false }))
        .toBeVisible({ timeout: 20_000 })

      await admin.goto('/admin/reports')
      const rewardCaseCard = admin.getByText(rewardReviewReason, { exact: true })
        .locator('..').locator('..')
      await expect(rewardCaseCard).toBeVisible()
      await rewardCaseCard.getByLabel('Evidence and reasoning').fill(
        'Initial evidence review found insufficient support for this specific Feedback credit.',
      )
      await rewardCaseCard.getByRole('button', { name: 'Invalidate credited reward' }).click()
      await expect(rewardCaseCard.getByText('Recorded outcome:', { exact: false }))
        .toBeVisible({ timeout: 20_000 })

      await requester.goto('/rewards')
      await expect(requester.getByText('0 XP', { exact: true })).toBeVisible()
      await expect(requester.getByLabel('First Reflection: Revoked')).toBeVisible()
      await expect(requester.getByRole('heading', { name: 'Reward reviews and corrections' }))
        .toBeVisible()
      await requester.getByLabel('Evidence and reasoning').fill(
        'The recorded session and related participant statements support reinstating my earned XP.',
      )
      await requester.getByRole('button', { name: 'Request independent appeal' }).click()
      await expect(requester.getByText('Your appeal:', { exact: false }))
        .toContainText('pending', { timeout: 20_000 })

      await appealAdmin.goto('/admin/reports')
      const independentRewardCard = appealAdmin
        .getByText(rewardReviewReason, { exact: true })
        .locator('..').locator('..')
      await expect(independentRewardCard.getByText('Appeal: pending', { exact: true }))
        .toBeVisible()
      await independentRewardCard.getByLabel('Evidence and reasoning').fill(
        'The appeal provides materially new participation records meriting a second independent determination.',
      )
      await independentRewardCard.getByRole('button', { name: 'Accept appeal and reopen' }).click()
      await expect(independentRewardCard.getByText('Appeal: accepted', { exact: true }))
        .toBeVisible({ timeout: 20_000 })

      await independentRewardCard.getByLabel('Evidence and reasoning').fill(
        'Independent reconsideration supports preserving this correctly earned feedback credit and achievement.',
      )
      await independentRewardCard.getByRole('button', { name: 'Dismiss review or restore credit' }).click()
      await expect(independentRewardCard.getByText('Recorded outcome:', { exact: false }))
        .toBeVisible({ timeout: 20_000 })

      await requester.reload()
      await expect(requester.getByText('10 XP', { exact: true })).toBeVisible()
      await expect(requester.getByLabel('First Reflection: Earned')).toBeVisible()
      await expect(requester.getByText('−10 XP correction', { exact: false })).toBeVisible()
      await expect(requester.locator('section[aria-labelledby="reward-review-history-heading"]')
        .getByText('+10 XP restored', { exact: false })).toBeVisible()

      // A separate disputed outcome must open the existing moderation queue,
      // never grant feedback/XP, and allow an independently reviewed appeal.
      await requester.goto(surrogacyUrl)
      const disputedScheduler = requester.getByText('Schedule a Moment', { exact: true }).locator('..').locator('..')
      await disputedScheduler.locator('input[type="datetime-local"]')
        .fill(new Date(Date.now() - 5 * 60_000).toISOString().slice(0, 16))
      await disputedScheduler.getByRole('spinbutton').fill('30')
      await disputedScheduler.getByRole('button', { name: 'Schedule Moment' }).click()
      await expect(requester.getByText('Moment: scheduled', { exact: true })).toBeVisible({ timeout: 20_000 })
      const disputedMoment = requester.getByText('Moment: scheduled', { exact: true }).locator('..').locator('..').locator('..')
      await disputedMoment.getByRole('button', { name: 'Complete' }).click()
      await expect(requester.getByText('Awaiting peer confirmation', { exact: true })).toBeVisible({ timeout: 20_000 })

      await provider.goto(surrogacyUrl)
      await provider.getByRole('button', { name: 'Dispute outcome' }).click()
      await expect(provider.getByText('Exchange dispute review', { exact: true })).toBeVisible({ timeout: 20_000 })
      await expect(provider.getByText('Case status:', { exact: false })).toBeVisible()

      await admin.goto('/admin/reports')
      const disputeCaseCard = admin.getByText('Disputed Exchange case', { exact: true }).locator('..').locator('..')
      await expect(disputeCaseCard).toBeVisible()
      await disputeCaseCard.getByLabel('Independent Exchange case determination rationale')
        .fill('The participants contest the completion outcome. Keep the event disputed pending further evidence.')
      await disputeCaseCard.getByRole('button', { name: 'Uphold the dispute' }).click()
      await expect(disputeCaseCard.getByText('Recorded outcome:', { exact: false })).toBeVisible({ timeout: 20_000 })

      await requester.reload()
      await expect(requester.getByText('Case status:', { exact: false })).toBeVisible()
      await requester.getByLabel('Reason for appeal')
        .fill('The original agreement and session notes should be reviewed by another administrator.')
      await requester.getByRole('button', { name: 'Submit appeal' }).click()
      await expect(requester.getByText('Your appeal:', { exact: false })).toBeVisible({ timeout: 20_000 })

      await appealAdmin.goto('/admin/reports')
      const independentCaseCard = appealAdmin.getByText('Disputed Exchange case', { exact: true }).locator('..').locator('..')
      await expect(independentCaseCard.getByText('Appeal: pending', { exact: true })).toBeVisible()
      await independentCaseCard.getByLabel('Independent appeal review rationale')
        .fill('The appeal contains additional evidence that warrants an independent reconsideration of the outcome.')
      await independentCaseCard.getByRole('button', { name: 'Accept and reopen case' }).click()
      await expect(independentCaseCard.getByText('Appeal: accepted', { exact: true })).toBeVisible({ timeout: 20_000 })

      await requester.reload()
      await expect(requester.getByText('Your appeal:', { exact: false })).toContainText('accepted')
      await expect(requester.getByText('Case status:', { exact: false })).toContainText('investigating')

      await provider.goto('/surrogacies')
      await expect(provider.getByText(`${needTitle} ↔ ${offerTitle}`, { exact: true })).toBeVisible()

      await provider.goto('/settings')
      await expect(provider.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible()
      await expect(provider.getByRole('link', { name: 'Manage saved & hidden recommendations' })).toHaveAttribute('href', '/discover/preferences')
      await expect(provider.getByRole('link', { name: 'Manage blocked members' })).toHaveAttribute('href', '/settings/blocked')
      await provider.getByRole('link', { name: 'Manage blocked members' }).click()
      await expect(provider.getByRole('heading', { name: 'Blocked members' })).toBeVisible()
      await provider.getByRole('link', { name: 'Back to Settings' }).click()
      await expect(provider.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible()
      await provider.getByRole('button', { name: 'Deactivate Consumer Trial Account' }).click()
      await expect(provider.getByRole('button', { name: 'Confirm Deactivation' })).toBeVisible()
      await provider.getByRole('button', { name: 'Cancel' }).click()
      await expect(provider.getByRole('button', { name: 'Confirm Deactivation' })).toHaveCount(0)
      await expect(provider.getByRole('link', { name: 'Download my data' })).toBeVisible()
      await expect(provider.getByRole('button', { name: 'Delete account' })).toBeVisible()
      await provider.getByRole('link', { name: 'Download my data' }).evaluate((element) => {
        element.scrollIntoView({ block: 'center' })
      })
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
      await expect(provider.getByText('Invalid login credentials', { exact: true })).toBeVisible({ timeout: 20_000 })
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
