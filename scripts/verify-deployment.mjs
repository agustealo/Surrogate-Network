#!/usr/bin/env node

const args = process.argv.slice(2)
const allowHttp = args.includes('--allow-http')
const positional = args.filter((arg) => arg !== '--allow-http')

if (positional.length !== 2) {
  console.error('Usage: node scripts/verify-deployment.mjs <target-url> <expected-revision> [--allow-http]')
  process.exit(2)
}

const [targetValue, expectedRevisionValue] = positional
const SAFE_REVISION = /^[0-9a-f]{7,64}$/i
const SAFE_REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/

function fail(message) {
  throw new Error(message)
}

function normalizeTarget(value) {
  let target
  try {
    target = new URL(value)
  } catch {
    fail('Target URL must be a valid absolute URL')
  }

  if (target.username || target.password) fail('Target URL must not contain credentials')
  if (target.search || target.hash) fail('Target URL must not contain query parameters or fragments')
  if (target.pathname !== '/' && target.pathname !== '') fail('Target URL must point at the deployment origin, not a nested path')
  if (target.protocol !== 'https:' && !(allowHttp && target.protocol === 'http:')) {
    fail('Deployment verification requires HTTPS. Use --allow-http only for a local production-runtime proof.')
  }

  return target.origin
}

function normalizeRevision(value) {
  const revision = value.trim().toLowerCase()
  if (!SAFE_REVISION.test(revision)) fail('Expected revision must be a 7-64 character hexadecimal git revision')
  return revision
}

function requireHeader(response, name) {
  const value = response.headers.get(name)
  if (!value) fail(`${response.url} is missing required ${name} header`)
  return value
}

function assertRequestId(response) {
  const requestId = requireHeader(response, 'x-request-id')
  if (!SAFE_REQUEST_ID.test(requestId)) fail(`${response.url} returned an invalid x-request-id`)
}

function assertNoStore(response) {
  const cacheControl = requireHeader(response, 'cache-control').toLowerCase()
  if (!cacheControl.includes('no-store')) fail(`${response.url} must be no-store`)
}

function assertNoCookies(response) {
  if (response.headers.get('set-cookie')) fail(`${response.url} must not set authentication/session cookies`)
}

async function request(origin, path, options = {}) {
  const response = await fetch(new URL(path, origin), {
    redirect: options.redirect ?? 'follow',
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
    headers: {
      'user-agent': 'surrogate-network-deployment-verifier/1',
    },
  })
  return response
}

async function json(response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    fail(`${response.url} did not return JSON`)
  }
  return response.json()
}

function assertRevision(body, expectedRevision, path) {
  if (typeof body.revision !== 'string') {
    fail(`${path} does not expose release revision metadata; configure SURROGATE_RELEASE_SHA or a supported provider commit SHA`)
  }
  if (body.revision.toLowerCase() !== expectedRevision) {
    fail(`${path} revision ${body.revision} does not match expected ${expectedRevision}`)
  }
}

async function verifyHealth(origin, expectedRevision) {
  const live = await request(origin, '/api/health/live')
  if (live.status !== 200) fail(`/api/health/live returned HTTP ${live.status}`)
  assertNoStore(live)
  assertNoCookies(live)
  assertRequestId(live)
  const liveBody = await json(live)
  if (liveBody.status !== 'alive') fail('/api/health/live did not report alive')
  assertRevision(liveBody, expectedRevision, '/api/health/live')

  const ready = await request(origin, '/api/health/ready')
  if (ready.status !== 200) fail(`/api/health/ready returned HTTP ${ready.status}`)
  assertNoStore(ready)
  assertNoCookies(ready)
  assertRequestId(ready)
  const readyBody = await json(ready)
  if (readyBody.status !== 'ready') fail('/api/health/ready did not report ready')
  if (readyBody.checks?.runtimeConfig !== 'ok' || readyBody.checks?.supabase !== 'ok') {
    fail('/api/health/ready did not prove runtime config and Supabase readiness')
  }
  assertRevision(readyBody, expectedRevision, '/api/health/ready')
}

function verifySecurityHeaders(response) {
  assertRequestId(response)
  const csp = requireHeader(response, 'content-security-policy')
  const lowerCsp = csp.toLowerCase()
  if (lowerCsp.includes('*.supabase.co')) fail('Production CSP must not allow wildcard Supabase projects')

  if (!allowHttp) {
    for (const forbidden of ['localhost', '127.0.0.1', 'ws://', 'http://']) {
      if (lowerCsp.includes(forbidden)) fail(`Production CSP contains forbidden local/insecure source: ${forbidden}`)
    }
  }

  if (requireHeader(response, 'x-content-type-options').toLowerCase() !== 'nosniff') {
    fail('X-Content-Type-Options must be nosniff')
  }
  if (requireHeader(response, 'x-frame-options').toUpperCase() !== 'DENY') {
    fail('X-Frame-Options must be DENY')
  }
  if (!requireHeader(response, 'referrer-policy').toLowerCase().includes('strict-origin-when-cross-origin')) {
    fail('Referrer-Policy is not the expected production policy')
  }
  requireHeader(response, 'permissions-policy')
  const hsts = requireHeader(response, 'strict-transport-security').toLowerCase()
  if (!hsts.includes('max-age=')) fail('Strict-Transport-Security must define max-age')
}

async function verifyPublicSurface(origin) {
  const home = await request(origin, '/')
  if (home.status !== 200) fail(`/ returned HTTP ${home.status}`)
  verifySecurityHeaders(home)

  for (const path of ['/login', '/signup', '/forgot-password']) {
    const response = await request(origin, path)
    if (response.status !== 200) fail(`${path} returned HTTP ${response.status}`)
    verifySecurityHeaders(response)
  }
}

async function main() {
  const origin = normalizeTarget(targetValue)
  const expectedRevision = normalizeRevision(expectedRevisionValue)

  await verifyHealth(origin, expectedRevision)
  await verifyPublicSurface(origin)

  console.log(`Deployment verified: ${origin}`)
  console.log(`Revision verified: ${expectedRevision}`)
  console.log('Checks: liveness, dependency readiness, request correlation, no-store health, public auth surface, CSP, anti-framing, content-sniffing, referrer, permissions, and HSTS')
}

main().catch((error) => {
  console.error(`Deployment verification failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
