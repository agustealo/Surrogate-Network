import { spawnSync } from 'node:child_process'
import path from 'node:path'

const verifier = path.join(process.cwd(), 'scripts', 'verify-deployment.mjs')
const revision = 'f5ab06bfa24986295f52016475d47ef20f883ac4'

function verify(target: string, ...flags: string[]) {
  return spawnSync(process.execPath, [verifier, target, revision, ...flags], {
    encoding: 'utf8',
    timeout: 5_000,
  })
}

describe('Deployment verifier HTTP exception', () => {
  it.each([
    'http://example.com',
    'http://192.168.1.22',
    'http://169.254.169.254',
    'http://10.0.0.1',
  ])('refuses non-loopback target %s even with local HTTP override', (target) => {
    const result = verify(target, '--allow-http')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('--allow-http is restricted to local loopback')
  })

  it('requires HTTPS when the override is absent, including on loopback', () => {
    const result = verify('http://127.0.0.1:1')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Deployment verification requires HTTPS')
  })

  it.each(['http://127.0.0.1:1', 'http://localhost:1', 'http://[::1]:1'])(
    'permits the local-only transport exception for %s without claiming deployment success',
    (target) => {
      const result = verify(target, '--allow-http')
      expect(result.stderr).not.toContain('--allow-http is restricted to local loopback')
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('Deployment verification failed:')
    },
  )
})
