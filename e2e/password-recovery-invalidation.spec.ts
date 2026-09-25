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
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Create Account' }).click()
  await page.waitForURL(/\/profile\//, { timeout: 20_000 })
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email Address').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
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

async function dispose(contexts: BrowserContext[]) {
  await Promise.allSettled(contexts.map((context) => context.close()))
}

test.describe('Password recovery credential invalidation @smoke', () => {
  test('recovery invalidates the previous password and accepts only the replacement credential', async ({ browser }) => {
    const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    const member: TrialMember = {
      name: 'Recovery Invalidation Member',
      email: `recovery-invalidation-${runId}@test.local`,
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
      await signIn(oldCredentialLogin, member.email, member.password)
      await expect(oldCredentialLogin.getByRole('alert')).toBeVisible({ timeout: 20_000 })
      await expect(oldCredentialLogin).toHaveURL(/\/login$/)

      const newCredentialLogin = await newCredentialContext.newPage()
      await signIn(newCredentialLogin, member.email, newPassword)
      await newCredentialLogin.waitForURL(/\/home$/, { timeout: 20_000 })
      await expect(newCredentialLogin).toHaveURL(/\/home$/)
    } finally {
      await dispose(contexts)
    }
  })
})
