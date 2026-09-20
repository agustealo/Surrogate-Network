import Link from 'next/link'
import { redirect } from 'next/navigation'
import { UnblockMemberButton } from '@/components/safety/UnblockMemberButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient, createServiceClient } from '@/infrastructure/supabase/server'

export default async function BlockedMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: blocks, error } = await supabase
    .from('blocks')
    .select('blocked_user_id,created_at')
    .eq('blocker_user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Unable to load blocked members: ${error.message}`)

  const ids = (blocks ?? []).map((block) => block.blocked_user_id)
  const service = createServiceClient()
  const profilesResult = ids.length
    ? await service.from('profiles').select('id,name').in('id', ids)
    : { data: [], error: null }
  if (profilesResult.error) throw new Error(`Unable to load blocked member labels: ${profilesResult.error.message}`)

  const names = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.name]))

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-bold">Blocked members</h1><p className="text-muted-foreground">Manage accounts you have blocked from future discovery and pairing.</p></div>
        <Button asChild variant="outline"><Link href="/settings">Back to Settings</Link></Button>
      </div>
      {!blocks?.length ? (
        <Card><CardHeader><CardTitle>No blocked members</CardTitle><CardDescription>Accounts you block from a profile will appear here.</CardDescription></CardHeader></Card>
      ) : (
        <div className="space-y-3">
          {blocks.map((block) => {
            const name = names.get(block.blocked_user_id) ?? 'Blocked member'
            return (
              <Card key={block.blocked_user_id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
                  <div><p className="font-medium">{name}</p><p className="text-sm text-muted-foreground">Blocked {new Date(block.created_at).toLocaleDateString()}</p></div>
                  <UnblockMemberButton userId={block.blocked_user_id} name={name} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
