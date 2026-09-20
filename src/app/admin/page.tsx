import { Activity, AlertTriangle, Heart, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createServiceClient } from '@/infrastructure/supabase/server'

export default async function AdminDashboard() {
  // AdminLayout has already authenticated and authorized the human actor for
  // this request. Global operational metrics must therefore use the privileged
  // server client instead of the actor's RLS-scoped member client.
  const supabase = createServiceClient()
  const [members, surrogacies, reports, audit] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('surrogacies').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('reports').select('id', { count: 'exact', head: true }).in('status', ['pending', 'investigating']),
    supabase.from('audit_events').select('id', { count: 'exact', head: true }),
  ])

  const failed = [members, surrogacies, reports, audit].find((result) => result.error)
  if (failed?.error) throw new Error('Unable to load administrative metrics.')

  const stats = [
    ['Members', members.count ?? 0, Users],
    ['Active Surrogacies', surrogacies.count ?? 0, Heart],
    ['Open Reports', reports.count ?? 0, AlertTriangle],
    ['Audit Events', audit.count ?? 0, Activity],
  ] as const

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6"><h1 className="text-3xl font-bold">Admin Console</h1><p className="text-muted-foreground">Global operational state loaded through the server-only administrative data plane.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, Icon]) => (
          <Card key={label}><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium">{label}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">{value}</div></CardContent></Card>
        ))}
      </div>
    </div>
  )
}
