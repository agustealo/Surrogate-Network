import { Award, ShieldCheck } from 'lucide-react'
import { requireAdmin } from '@/application/actions/adminContext'
import { AchievementRuleControl } from '@/components/admin/AchievementRuleControl'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createServiceClient } from '@/infrastructure/supabase/server'

function readableDate(date: string | null): string {
  return date ? new Date(date).toLocaleString() : 'Unavailable'
}

export default async function AchievementAdministrationPage() {
  await requireAdmin()
  const service = createServiceClient()

  const [definitionsResult, awardedResult, historyResult, excludedCreditsResult] = await Promise.all([
    service.from('achievement_definitions')
      .select('code,title,description,metric,target,enabled,rule_version,updated_at')
      .order('target', { ascending: true }),
    service.from('member_achievements')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'earned'),
    service.from('audit_events')
      .select('id,actor_id,action,target_id,reason,timestamp')
      .eq('action', 'achievement_rule_state_changed')
      .order('timestamp', { ascending: false })
      .limit(12),
    service.from('audit_events')
      .select('id,actor_id,target_id,reason,timestamp')
      .eq('action', 'reward_credit_excluded')
      .order('timestamp', { ascending: false })
      .limit(20),
  ])

  if (definitionsResult.error || awardedResult.error || historyResult.error || excludedCreditsResult.error) {
    throw new Error('Unable to load achievement operations.')
  }

  const definitions = definitionsResult.data ?? []
  const countResults = await Promise.all(
    definitions.map((definition) =>
      service.from('member_achievements')
        .select('id', { count: 'exact', head: true })
        .eq('achievement_code', definition.code)
        .eq('status', 'earned'),
    ),
  )
  if (countResults.some((result) => result.error)) {
    throw new Error('Unable to load achievement award counts.')
  }

  const enabledCount = definitions.filter((rule) => rule.enabled).length

  return (
    <div className="container mx-auto max-w-6xl space-y-7 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold">Achievement governance</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Supervise nonmonetary achievement rules and inspect the verified award count.
          All criteria are versioned in migrations. New issuance can be paused here; individual reward reviews, badge revocations and restored credits are independently adjudicated under Moderation Reports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Available rules</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{definitions.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Issuing now</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{enabledCount}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Earned awards</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{awardedResult.count ?? 0}</CardContent>
        </Card>
      </div>

      <section aria-labelledby="achievement-rule-heading" className="space-y-4">
        <div className="space-y-2">
          <h2 id="achievement-rule-heading" className="text-2xl font-semibold">Award rules</h2>
          <p className="text-sm text-muted-foreground">Pausing a rule stops future awards without removing recognition already earned.</p>
        </div>
        {definitions.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {definitions.map((definition, index) => (
              <Card key={definition.code}>
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted" aria-hidden="true">
                      <Award className="h-5 w-5" />
                    </span>
                    <Badge variant={definition.enabled ? 'default' : 'secondary'}>
                      {definition.enabled ? 'Issuing' : 'Paused'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{definition.title}</CardTitle>
                  <CardDescription>{definition.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p><span className="text-muted-foreground">Evidence:</span> {definition.target} eligible Feedback submission{definition.target === 1 ? '' : 's'}</p>
                  <p><span className="text-muted-foreground">Rule version:</span> {definition.rule_version}</p>
                  <p><span className="text-muted-foreground">Awards earned:</span> {countResults[index].count ?? 0}</p>
                  <p><span className="text-muted-foreground">Updated:</span> {readableDate(definition.updated_at)}</p>
                  <AchievementRuleControl code={definition.code} enabled={definition.enabled} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card><CardContent className="py-6 text-muted-foreground">No achievement rules are configured.</CardContent></Card>
        )}
      </section>

      <section aria-labelledby="credit-safeguards-heading">
        <Card>
          <CardHeader>
            <CardTitle id="credit-safeguards-heading" className="text-xl">Reward-credit safeguards</CardTitle>
            <CardDescription>
              A rolling seven-day window allows up to four rewarded Feedback submissions
              across a member pair, and ten per member. Additional Feedback is saved,
              but does not create XP or new achievement milestones. Exclusions are
              nonpunitive and are not findings of fraud.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {excludedCreditsResult.data?.length ? (
              <ol className="divide-y">
                {excludedCreditsResult.data.map((event) => (
                  <li key={event.id} className="space-y-1 py-3 text-sm">
                    <p className="font-medium">
                      {event.reason === 'pair_weekly_limit'
                        ? 'Repeated pair credit limit'
                        : event.reason === 'member_weekly_limit'
                          ? 'Member weekly credit limit'
                          : 'Credit policy exclusion'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Member {event.actor_id ?? 'Unavailable'} ·
                      Feedback {event.target_id ?? 'Unavailable'} ·
                      {readableDate(event.timestamp)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No reward-credit exclusions have been recorded.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="achievement-history-heading">
        <Card>
          <CardHeader>
            <CardTitle id="achievement-history-heading" className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              Policy audit history
            </CardTitle>
            <CardDescription>Recorded administrators, change reasons, and times for the latest rule-state decisions.</CardDescription>
          </CardHeader>
          <CardContent>
            {historyResult.data?.length ? (
              <ol className="divide-y">
                {historyResult.data.map((event) => (
                  <li key={event.id} className="space-y-1 py-3 text-sm">
                    <p className="font-medium">{event.target_id}</p>
                    <p className="text-muted-foreground">{event.reason ?? 'No reason recorded'}</p>
                    <p className="text-xs text-muted-foreground">
                      Administrator {event.actor_id ?? 'Unavailable'} · {readableDate(event.timestamp)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No achievement policy changes have been recorded.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
