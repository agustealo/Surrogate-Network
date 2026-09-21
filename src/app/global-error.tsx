'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
          <section className="w-full rounded-lg border p-8 shadow-sm" aria-labelledby="global-error-title">
            <p className="text-sm font-medium">Unexpected application error</p>
            <h1 id="global-error-title" className="mt-2 text-3xl font-semibold tracking-tight">
              Surrogate Companion could not finish this request
            </h1>
            <p className="mt-4 text-sm">
              The application hit an unrecoverable rendering error. Retry the request, or return later if the problem continues.
            </p>
            {error.digest ? (
              <p className="mt-3 font-mono text-xs">Error reference: {error.digest}</p>
            ) : null}
            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  )
}
