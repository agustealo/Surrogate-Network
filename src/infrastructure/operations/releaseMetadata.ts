export type ReleaseRevisionSource = {
  surrogateReleaseSha?: string
  vercelGitCommitSha?: string
  githubSha?: string
}

const SAFE_REVISION = /^[0-9a-f]{7,64}$/i

function normalizeRevision(value: string | undefined) {
  const normalized = value?.trim()
  if (!normalized || !SAFE_REVISION.test(normalized)) return null
  return normalized.toLowerCase()
}

export function resolveReleaseRevision(source: ReleaseRevisionSource) {
  return normalizeRevision(source.surrogateReleaseSha)
    ?? normalizeRevision(source.vercelGitCommitSha)
    ?? normalizeRevision(source.githubSha)
}

export function getReleaseRevision() {
  return resolveReleaseRevision({
    surrogateReleaseSha: process.env.SURROGATE_RELEASE_SHA,
    vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA,
    githubSha: process.env.GITHUB_SHA,
  })
}
