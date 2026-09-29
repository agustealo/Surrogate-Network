import { spawnSync } from 'node:child_process'

const networkName = 'surrogate-network-local'

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options,
  })

  if (result.error) throw result.error
  return result.status ?? 1
}

function quietRun(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'ignore',
    shell: false,
  })

  if (result.error && result.error.code === 'ENOENT') {
    throw new Error(`${command} is required to start the local Supabase runtime.`)
  }

  return result.status ?? 1
}

if (quietRun('docker', ['network', 'inspect', networkName]) !== 0) {
  const createStatus = run('docker', [
    'network',
    'create',
    '--opt',
    'com.docker.network.bridge.host_binding_ipv4=127.0.0.1',
    networkName,
  ])

  if (createStatus !== 0) {
    throw new Error(`Unable to create loopback-only Docker network ${networkName}.`)
  }
}

const startStatus = run('supabase', ['start', '--network-id', networkName])
if (startStatus !== 0) process.exit(startStatus)
