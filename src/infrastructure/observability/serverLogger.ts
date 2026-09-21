import { REQUEST_ID_HEADER, stripQueryAndFragment } from './requestCorrelation'

type RequestLike = {
  path: string
  method: string
  headers: Record<string, string | string[] | undefined>
}

type RequestContextLike = {
  routerKind: string
  routePath: string
  routeType: string
  renderSource?: string
  revalidateReason?: string
  renderType?: string
}

type NormalizedError = {
  name: string
  message: string
  stack: string | null
  digest: string | null
}

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string
) {
  const direct = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()]
  return Array.isArray(direct) ? direct[0] : direct
}

function fingerprint(value: string) {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function stringField(value: unknown, key: string) {
  if (typeof value !== 'object' || value === null || !(key in value)) {
    return null
  }

  const field = (value as Record<string, unknown>)[key]
  return typeof field === 'string' ? field : null
}

function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return {
      name: error.name || 'Error',
      message: error.message,
      stack: error.stack ?? null,
      digest: stringField(error, 'digest'),
    }
  }

  return {
    name: stringField(error, 'name') ?? 'NonErrorThrown',
    message: stringField(error, 'message') ?? String(error),
    stack: stringField(error, 'stack'),
    digest: stringField(error, 'digest'),
  }
}

export function buildServerRequestErrorLog(
  error: unknown,
  request: RequestLike,
  context: RequestContextLike,
  nodeEnv = process.env.NODE_ENV
) {
  const production = nodeEnv === 'production'
  const normalizedError = normalizeError(error)

  return {
    level: 'error',
    event: 'next_request_error',
    timestamp: new Date().toISOString(),
    requestId: headerValue(request.headers, REQUEST_ID_HEADER) ?? null,
    method: request.method,
    path: stripQueryAndFragment(request.path),
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource ?? null,
    renderType: context.renderType ?? null,
    revalidateReason: context.revalidateReason ?? null,
    errorName: normalizedError.name,
    errorDigest: normalizedError.digest,
    errorFingerprint: fingerprint(`${normalizedError.name}:${normalizedError.message}`),
    ...(production
      ? {}
      : {
          errorMessage: normalizedError.message,
          errorStack: normalizedError.stack,
        }),
  }
}

export function logServerRequestError(
  error: unknown,
  request: RequestLike,
  context: RequestContextLike
) {
  console.error(JSON.stringify(buildServerRequestErrorLog(error, request, context)))
}
