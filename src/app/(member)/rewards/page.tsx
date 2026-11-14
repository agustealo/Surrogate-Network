import Link from 'next/link'
import { ArrowRight, Trophy } from 'lucide-react'
import { redirect } from 'next/navigation'
import { AchievementCard } from '@/components/member/AchievementCard'
import { RewardReviewAppealForm } from '@/components/rewards/RewardReviewControls'
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

  const [progressionResult, xpResult, definitionsResult, awardsResult, creditSummaryResult, correctionsResult, rewardReviewResult] = await Promise.all([
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
    supabase.rpc('get_my_reward_credit_summary').single(),
    supabase.from('reward_corrections')
      .select('id,action,reason,created_at,report_id,feedback_id')
      .eq('member_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('reports')
      .select('id,status,adjudication,action_taken,resolved_at,reward_feedback_id')
      .eq('case_origin', 'reward_review')
      .eq('reported_user_id', user.id).order('created_at', { ascending: false }).limit(20),
  ])

  const failed = [progressionResult, xpResult, definitionsResult, awardsResult, creditSummaryResult, correctionsResult, rewardReviewResult]
    .find((result) => result.error)
  if (failed?.error) throw new Error('Unable to load your reward history and achievements.')

  const reviewCaseIds = (rewardReviewResult.data ?? []).map((review) => review.id)
  const appealsResult = reviewCaseIds.length
    ? await supabase.from('report_appeals')
      .select('id,report_id,status,decision_reason')
      .eq('appellant_user_id', user.id).in('report_id', reviewCaseIds)
    : { data: [], error: null }
  if (appealsResult.error) throw new Error('Unable to load reward review appeals.')
  const myAppeals = new Map((appealsResult.data ?? []).map((appeal) => [appeal.report_id, appeal]))
  const corrections = correctionsResult.data ?? []
  const reviews = rewardReviewResult.data ?? []

  const progression = progressionResult.data
  const xpRows = xpResult.data ?? []
  const definitions = definitionsResult.data ?? []
  const eligibleFeedbackCount = creditSummaryResult.data?.credited_count ?? 0
  const uncreditedFeedbackCount = creditSummaryResult.data?.excluded_count ?? 0
  const pairWeeklyLimit = creditSummaryResult.data?.pair_seven_day_limit ?? 4
  const memberWeeklyLimit = creditSummaryResult.data?.member_seven_day_limit ?? 10
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
              Eligible, jointly confirmed Exchange feedback can earn 10 XP, regardless of rating. To discourage farming, up to {pairWeeklyLimit} credits per pair and {memberWeeklyLimit} per member are issued in a rolling seven-day window. New credits can also be withheld when a three-member reciprocal Feedback pattern requires review. This does not establish misconduct. You can always submit honest Feedback. XP has no cash value.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your recognition</CardTitle>
            <CardDescription>Evidence-linked achievements only</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {uncreditedFeedbackCount > 0 && <p className="text-sm text-muted-foreground" role="status">{uncreditedFeedbackCount} saved {uncreditedFeedbackCount === 1 ? 'feedback submission has' : 'feedback submissions have'} not earned XP under reward eligibility safeguards, including weekly limits or reciprocal-cycle review. This is not a misconduct finding. A review signal is not a fraud verdict.</p>}
            <p className="text-3xl font-bold">{earnedCount} <span className="text-base font-normal text-muted-foreground">of {definitions.length} earned</span></p>
            <p className="text-xs text-muted-foreground">Completed Exchanges alone do not issue high-value awards. Recognition follows recorded eligible Feedback.</p>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="achievement-gallery-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="achievement-gallery-heading" className="text-2xl font-semibold">Achievement gallery</h2>
            <p className="text-sm text-muted-foreground">New awards require two-party confirmation. Recognition earned before this safeguard remains in your history, but does not establish independently verified participation or safety.</p>
          </div>
          <Badge variant="outline">Participation recognition</Badge>
        </div>
        {definitions.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {definitions.map((definition) => (
              <AchievementCard
                key={definition.code}
                definition={definition}
                award={awardByCode.get(definition.code)}
                eligibleFeedbackCount={eligibleFeedbackCount}
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

      <section aria-labelledby="reward-review-history-heading">
        <Card>
          <CardHeader>
            <h2 id="reward-review-history-heading" className="text-2xl font-semibold leading-none tracking-tight">Reward reviews and corrections</h2>
            <CardDescription>Decisions affecting your own participation record, independent appeals, and compensating XP history. A review is not a misconduct finding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!reviews.length && !corrections.length && (
              <p className="text-sm text-muted-foreground">No reward corrections or Feedback eligibility reviews have been recorded for your account.</p>
            )}
            {reviews.map((review) => {
              const appeal = myAppeals.get(review.id)
              const canAppeal = (review.status === 'resolved' || review.status === 'dismissed')
                && !!review.resolved_at
                && new Date(review.resolved_at).getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000
              return (
                <div key={review.id} className="space-y-3 rounded-md border p-4">
                  <div className="flex flex-wrap gap-2"><Badge variant="outline">Case: {review.status}</Badge>{review.adjudication && <Badge variant="secondary">Outcome: {review.adjudication}</Badge>}</div>
                  <p className="text-sm text-muted-foreground">Linked Feedback: {review.reward_feedback_id}</p>
                  {review.action_taken && <p className="whitespace-pre-wrap text-sm">Recorded rationale: {review.action_taken}</p>}
                  {appeal ? (
                    <p className="text-sm">Your appeal: <strong>{appeal.status}</strong>{appeal.decision_reason ? '. ' + appeal.decision_reason : ''}</p>
                  ) : canAppeal ? <RewardReviewAppealForm reportId={review.id} /> : null}
                  {!appeal && !canAppeal && (review.status === 'resolved' || review.status === 'dismissed') && (
                    <p className="text-xs text-muted-foreground">The 30-day appeal period has ended.</p>
                  )}
                </div>
              )
            })}
            {!!corrections.length && (
              <div className="space-y-2">
                <h3 className="font-semibold">Compensating journal entries</h3>
                {corrections.map((correction) => (
                  <div key={correction.id} className="space-y-1 rounded-md border p-3 text-sm">
                    <p className="font-medium">{correction.action === 'reversed' ? '−10 XP correction' : '+10 XP restored'} · {formatDate(correction.created_at)}</p>
                    <p className="text-muted-foreground">{correction.reason}</p>
                    <p className="text-xs text-muted-foreground">Case {correction.report_id}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
