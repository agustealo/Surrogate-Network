'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center px-6 py-16">
      <section className="w-full rounded-lg border bg-card p-8 text-card-foreground shadow-sm" aria-labelledby="runtime-error-title">
        <p className="text-sm font-medium text-muted-foreground">Unexpected application error</p>
        <h1 id="runtime-error-title" className="mt-2 text-3xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          The request could not be completed. You can retry without losing the current account session.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Error reference: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </section>
    </main>
  )
}
