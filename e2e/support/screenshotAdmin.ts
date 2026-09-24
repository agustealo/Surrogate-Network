import { createClient } from '@supabase/supabase-js'

function requireLocalScreenshotRuntime() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Local Supabase service configuration is required for screenshot-admin provisioning')
  }

  const parsed = new URL(url)
  if (!['127.0.0.1', 'localhost'].includes(parsed.hostname)) {
    throw new Error(`Refusing screenshot-admin provisioning against non-local Supabase host: ${parsed.hostname}`)
  }

  if (process.env.CI !== 'true') {
    throw new Error('Screenshot-admin provisioning is restricted to the isolated CI screenshot runtime')
  }

  return { url, serviceRoleKey }
}

export async function provisionScreenshotAdmin(email: string) {
  const { url, serviceRoleKey } = requireLocalScreenshotRuntime()
  const service = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: profile, error: lookupError } = await service
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (lookupError || !profile) {
    throw new Error(`Unable to resolve screenshot admin profile: ${lookupError?.message ?? 'profile missing'}`)
  }

  const { error: updateError } = await service
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', profile.id)

  if (updateError) {
    throw new Error(`Unable to provision screenshot admin role: ${updateError.message}`)
  }
}
