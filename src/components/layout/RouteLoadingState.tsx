import { LoaderCircle } from 'lucide-react'

export function RouteLoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="container mx-auto flex min-h-[40vh] max-w-6xl items-center justify-center px-4 py-12">
      <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status" aria-live="polite">
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  )
}
