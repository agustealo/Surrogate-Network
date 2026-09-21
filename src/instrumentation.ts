import type { Instrumentation } from 'next'

import { logServerRequestError } from '@/infrastructure/observability/serverLogger'

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  logServerRequestError(error, request, context)
}
