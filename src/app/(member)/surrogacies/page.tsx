import { createClient } from '@/infrastructure/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function MemberSurrogaciesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: surrogacies, error } = await supabase.from('surrogacies').select('id,status,started_at,ended_at').contains('partner_ids', [user!.id]).order('started_at', { ascending: false });
  if (error) throw new Error('Unable to load your connections.');

  return <div className="container mx-auto max-w-5xl px-4 py-6"><div className="mb-6"><h1 className="text-3xl font-bold">Connections</h1><p className="text-muted-foreground">Your established Surrogate Network relationships.</p></div>
    {surrogacies?.length ? <div className="grid gap-4">{surrogacies.map((item) => <Card key={item.id}><CardHeader><CardTitle>Surrogacy</CardTitle></CardHeader><CardContent><p>Status: {item.status}</p><p className="text-sm text-muted-foreground">Started {new Date(item.started_at).toLocaleDateString()}</p></CardContent></Card>)}</div> : <Card><CardContent className="py-10 text-center"><p className="text-muted-foreground">You do not have an active Surrogacy yet. Accepted proposals will appear here.</p></CardContent></Card>}
  </div>;
}
