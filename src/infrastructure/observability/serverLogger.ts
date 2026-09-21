import { REQUEST_ID_HEADER, stripQueryAndFragment } from './requestCorrelation'

type RequestErrorLike = Error & { digest?: string }

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

export function buildServerRequestErrorLog(
  error: RequestErrorLike,
  request: RequestLike,
  context: RequestContextLike,
  nodeEnv = process.env.NODE_ENV
) {
  const production = nodeEnv === 'production'

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
    errorName: error.name || 'Error',
    errorDigest: error.digest ?? null,
    errorFingerprint: fingerprint(`${error.name}:${error.message}`),
    ...(production
      ? {}
      : {
          errorMessage: error.message,
          errorStack: error.stack ?? null,
        }),
  }
}

export function logServerRequestError(
  error: RequestErrorLike,
  request: RequestLike,
  context: RequestContextLike
) {
  console.error(JSON.stringify(buildServerRequestErrorLog(error, request, context)))
}
