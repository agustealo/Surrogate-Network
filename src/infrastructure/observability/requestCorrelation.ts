export const REQUEST_ID_HEADER = 'x-request-id'

const SAFE_REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/

function generateRequestId() {
  const cryptoApi = globalThis.crypto

  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID()
  }

  if (typeof cryptoApi?.getRandomValues === 'function') {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16))
    const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    return `req-${token}`
  }

  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`
}

export function resolveRequestId(candidate: string | null | undefined) {
  if (candidate && SAFE_REQUEST_ID.test(candidate)) {
    return candidate
  }

  return generateRequestId()
}

export function stripQueryAndFragment(path: string) {
  const queryIndex = path.indexOf('?')
  const fragmentIndex = path.indexOf('#')
  const cutAt = [queryIndex, fragmentIndex]
    .filter((index) => index >= 0)
    .reduce((lowest, index) => Math.min(lowest, index), path.length)

  return path.slice(0, cutAt) || '/'
}
