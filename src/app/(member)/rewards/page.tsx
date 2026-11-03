import Link from 'next/link'
import { ArrowRight, Trophy } from 'lucide-react'
import { redirect } from 'next/navigation'
import { AchievementCard } from '@/components/member/AchievementCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/infrastructure/supabase/server'
import { routes } from '@/lib/routes'

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : 'date unavailable'
}

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(routes.public.login)

  const [progressionResult, xpResult, definitionsResult, awardsResult] = await Promise.all([
    supabase.from('member_progression')
      .select('current_rank,total_xp,achievements,level')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('xp_transactions')
      .select('id,amount,source,description,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('achievement_definitions')
      .select('code,title,description,category,metric,target,enabled,rule_version')
      .order('target', { ascending: true }),
    supabase.from('member_achievements')
      .select('id,achievement_code,rule_version,status,earned_at,revoked_at')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false }),
  ])

  const failed = [progressionResult, xpResult, definitionsResult, awardsResult]
    .find((result) => result.error)
  if (failed?.error) throw new Error('Unable to load your reward history and achievements.')

  const progression = progressionResult.data
  const xpRows = xpResult.data ?? []
  const definitions = definitionsResult.data ?? []
  const awards = awardsResult.data ?? []
  const awardByCode = new Map(awards.map((award) => [award.achievement_code, award]))
  const earnedCount = awards.filter((award) => award.status === 'earned').length
  const legacyAchievements = progression?.achievements ?? []
  const rank = Math.max(1, progression?.current_rank ?? 1)
  const totalXp = Math.max(0, progression?.total_xp ?? 0)
  const nextMilestone = rank * 100
  const rankProgress = Math.min(100, Math.max(0, totalXp - (rank - 1) * 100))

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Rewards &amp; Progression</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            See how your real contributions build a record of participation. Recognition is not a safety credential or currency.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={routes.member.surrogacies}>
            View your Connections <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" aria-hidden="true" /> Rank {rank}
            </CardTitle>
            <CardDescription>Your XP reflects recorded participation, not trustworthiness.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold">{totalXp.toLocaleString()} XP</p>
            <Progress value={rankProgress} aria-label="Progress toward the next rank" />
            <p className="text-sm text-muted-foreground">
              Next rank at {nextMilestone.toLocaleString()} XP
            </p>
            <p className="text-xs text-muted-foreground">
              Submitting eligible Exchange feedback earns 10 XP, regardless of rating. XP has no cash value.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your recognition</CardTitle>
            <CardDescription>Evidence-linked achievements only</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold">{earnedCount} <span className="text-base font-normal text-muted-foreground">of {definitions.length} earned</span></p>
            <p className="text-xs text-muted-foreground">Completed Exchanges alone do not issue high-value awards. Recognition follows recorded eligible Feedback.</p>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="achievement-gallery-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="achievement-gallery-heading" className="text-2xl font-semibold">Achievement gallery</h2>
            <p className="text-sm text-muted-foreground">Each achievement includes its actual earning requirement and status.</p>
          </div>
          <Badge variant="outline">Verified participation</Badge>
        </div>
        {definitions.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {definitions.map((definition) => (
              <AchievementCard
                key={definition.code}
                definition={definition}
                award={awardByCode.get(definition.code)}
              />
            ))}
          </div>
        ) : (
          <Card><CardContent className="py-6 text-muted-foreground">No achievement definitions are available.</CardContent></Card>
        )}
        {!!legacyAchievements.length && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Previous recognition</CardTitle>
              <CardDescription>These names were saved before evidence-linked achievement records were introduced. They remain visible but are not independently verified.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {legacyAchievements.map((name) => <Badge key={name} variant="secondary">{name}</Badge>)}
            </CardContent>
          </Card>
        )}
      </section>

      <section aria-labelledby="xp-history-heading">
        <Card>
          <CardHeader>
            <CardTitle id="xp-history-heading">Recent XP activity</CardTitle>
            <CardDescription>Recorded nonmonetary journal entries</CardDescription>
          </CardHeader>
          <CardContent>
            {xpRows.length ? (
              <div className="divide-y">
                {xpRows.map((row) => (
                  <div key={row.id} className="flex items-start justify-between gap-4 py-3">
                    <div>
                      <p className="font-medium">{row.description}</p>
                      <p className="text-xs text-muted-foreground">{row.source} · {formatDate(row.created_at)}</p>
                    </div>
                    <span className="font-mono tabular-nums">{row.amount > 0 ? '+' : ''}{row.amount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No XP activity yet. Your record begins with eligible participation.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
