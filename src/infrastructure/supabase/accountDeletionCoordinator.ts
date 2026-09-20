import 'server-only'

import { createServiceClient } from '@/infrastructure/supabase/server'

export type PreparedAuthDeletionResult = {
  authRemoved: boolean
}

/**
 * Coordinates external Supabase Auth removal only after Postgres has already
 * established the permanent deletion tombstone. This is the narrow system
 * boundary allowed to use service-role/Admin Auth authority.
 */
export async function removePreparedAuthIdentity(userId: string): Promise<PreparedAuthDeletionResult> {
  const service = createServiceClient()

  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('trial_deleted_at')
    .eq('id', userId)
    .single()
  if (profileError || !profile?.trial_deleted_at) {
    throw new Error('Auth deletion refused because the account tombstone is not prepared.')
  }

  const failures: string[] = []
  const deletedEmail = `deleted+${userId.replaceAll('-', '')}@deleted.invalid`

  const { error: quarantineError } = await service.auth.admin.updateUserById(userId, {
    ban_duration: '876000h',
    email: deletedEmail,
    user_metadata: { deleted: true },
  })
  if (quarantineError) failures.push(`auth quarantine: ${quarantineError.message}`)

  const { error: deleteError } = await service.auth.admin.deleteUser(userId)
  if (deleteError) failures.push(`auth deletion: ${deleteError.message}`)

  const authRemoved = !deleteError
  const { error: recordError } = await service.rpc('record_trial_auth_deletion_attempt', {
    p_user_id: userId,
    p_auth_deleted: authRemoved,
    p_error: failures.length ? failures.join('; ') : undefined,
  })
  if (recordError) throw new Error(`Unable to persist Auth deletion attempt: ${recordError.message}`)

  return { authRemoved }
}
