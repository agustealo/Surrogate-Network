import { CheckCircle2, LockKeyhole, PauseCircle, ShieldAlert, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Database } from '@/infrastructure/supabase/database.types'

type Definition = Pick<
  Database['public']['Tables']['achievement_definitions']['Row'],
  'code' | 'title' | 'description' | 'category' | 'metric' | 'target' | 'enabled'
>
type Award = Pick<
  Database['public']['Tables']['member_achievements']['Row'],
  'achievement_code' | 'earned_at' | 'status' | 'rule_version'
>

export type AchievementCardProps = {
  definition: Definition
  award?: Award
}

export function AchievementCard({ definition, award }: AchievementCardProps) {
  const earned = award?.status === 'earned'
  const revoked = award?.status === 'revoked'
  const paused = !definition.enabled && !earned && !revoked
  const Icon = revoked ? ShieldAlert : earned ? CheckCircle2 : paused ? PauseCircle : LockKeyhole
  const status = revoked ? 'Revoked' : earned ? 'Earned' : paused ? 'Paused' : 'Not earned'

  return (
    <Card className="h-full" aria-label={definition.title + ': ' + status}>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className={'inline-flex h-11 w-11 items-center justify-center rounded-full border ' + (earned ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <Badge variant={earned ? 'default' : revoked ? 'destructive' : 'secondary'}>{status}</Badge>
        </div>
        <CardTitle className="text-lg">{definition.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">{definition.description}</p>
        <p className="flex items-center gap-2 text-xs font-medium">
          <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {definition.target} {definition.target === 1 ? 'eligible Feedback submission' : 'distinct eligible Feedback submissions'}
        </p>
        {earned && (
          <p className="text-xs text-muted-foreground">
            Earned {new Date(award.earned_at).toLocaleDateString()}. Rule version {award.rule_version}.
          </p>
        )}
        {paused && (
          <p className="text-xs text-muted-foreground">New awards are currently paused by the network administrators. Existing recognition is preserved.</p>
        )}
        {revoked && (
          <p className="text-xs text-muted-foreground">This award was withdrawn. Contact support to request a review.</p>
        )}
      </CardContent>
    </Card>
  )
}
