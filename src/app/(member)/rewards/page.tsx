import { Trophy } from 'lucide-react'
import { createClient } from '@/infrastructure/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : 'date unavailable'
}

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: progression, error: progressionError }, { data: xpRows, error: xpError }] = await Promise.all([
    supabase.from('member_progression').select('current_rank,total_xp,achievements,level').eq('user_id', user!.id).maybeSingle(),
    supabase.from('xp_transactions').select('id,amount,source,description,created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20),
  ])
  if (progressionError || xpError) throw new Error('Unable to load progression.')

  const rank = progression?.current_rank ?? 1
  const totalXp = progression?.total_xp ?? 0
  const achievements = progression?.achievements ?? []
  const nextMilestone = Math.max(500, Math.ceil((totalXp + 1) / 500) * 500)

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6"><h1 className="text-3xl font-bold">Rewards & Progression</h1><p className="text-muted-foreground">Your earned progression, backed by the XP ledger.</p></div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" />Rank {rank}</CardTitle></CardHeader><CardContent className="space-y-3"><div className="text-3xl font-bold">{totalXp.toLocaleString()} XP</div><Progress value={Math.min(100, (totalXp / nextMilestone) * 100)} /><p className="text-sm text-muted-foreground">Next XP milestone: {nextMilestone.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Achievements</CardTitle></CardHeader><CardContent>{achievements.length ? <ul className="space-y-2">{achievements.map((achievement) => <li key={achievement} className="rounded border p-3">{achievement}</li>)}</ul> : <p className="text-muted-foreground">No achievements earned yet.</p>}</CardContent></Card>
      </div>
      <Card className="mt-6"><CardHeader><CardTitle>Recent XP activity</CardTitle></CardHeader><CardContent>{xpRows?.length ? <div className="divide-y">{xpRows.map((row) => <div key={row.id} className="flex items-start justify-between py-3"><div><p className="font-medium">{row.description}</p><p className="text-xs text-muted-foreground">{row.source} · {formatDate(row.created_at)}</p></div><span className="font-mono">+{row.amount}</span></div>)}</div> : <p className="text-muted-foreground">No XP activity yet.</p>}</CardContent></Card>
    </div>
  )
}
