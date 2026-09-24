import { resolveReleaseRevision } from '@/infrastructure/operations/releaseMetadata'

describe('release metadata', () => {
  it('prefers the explicit Surrogate release SHA', () => {
    expect(resolveReleaseRevision({
      surrogateReleaseSha: 'A'.repeat(40),
      vercelGitCommitSha: 'b'.repeat(40),
      githubSha: 'c'.repeat(40),
    })).toBe('a'.repeat(40))
  })

  it('falls back through provider and GitHub revision sources', () => {
    expect(resolveReleaseRevision({
      vercelGitCommitSha: 'B'.repeat(40),
      githubSha: 'c'.repeat(40),
    })).toBe('b'.repeat(40))

    expect(resolveReleaseRevision({
      githubSha: 'C'.repeat(40),
    })).toBe('c'.repeat(40))
  })

  it('rejects malformed revision metadata instead of echoing arbitrary environment content', () => {
    expect(resolveReleaseRevision({
      surrogateReleaseSha: 'release-prod<script>',
      vercelGitCommitSha: 'not-a-sha',
      githubSha: 'still-not-a-sha',
    })).toBeNull()
  })

  it('accepts short immutable git revisions for non-GitHub deployment systems', () => {
    expect(resolveReleaseRevision({ surrogateReleaseSha: 'AbC1234' })).toBe('abc1234')
  })
})
