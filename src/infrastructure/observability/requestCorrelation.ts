export const REQUEST_ID_HEADER = 'x-request-id'

const SAFE_REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/

export function resolveRequestId(candidate: string | null | undefined) {
  if (candidate && SAFE_REQUEST_ID.test(candidate)) {
    return candidate
  }

  return crypto.randomUUID()
}

export function stripQueryAndFragment(path: string) {
  const queryIndex = path.indexOf('?')
  const fragmentIndex = path.indexOf('#')
  const cutAt = [queryIndex, fragmentIndex]
    .filter((index) => index >= 0)
    .reduce((lowest, index) => Math.min(lowest, index), path.length)

  return path.slice(0, cutAt) || '/'
}
