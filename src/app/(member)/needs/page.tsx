import Link from 'next/link';
import { createClient } from '@/infrastructure/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function MemberNeedsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: needs, error } = await supabase.from('needs').select('id,title,description,status,created_at').eq('user_id', user!.id).order('created_at', { ascending: false });
  if (error) throw new Error('Unable to load your needs.');

  return <div className="container mx-auto max-w-5xl px-4 py-6"><div className="mb-6 flex items-center justify-between"><div><h1 className="text-3xl font-bold">Needs</h1><p className="text-muted-foreground">What you are currently asking the network to help fulfill.</p></div><Button asChild><Link href="/needs/create">Create need</Link></Button></div>
    {needs?.length ? <div className="grid gap-4">{needs.map((need) => <Card key={need.id}><CardHeader><CardTitle>{need.title}</CardTitle></CardHeader><CardContent><p>{need.description}</p><p className="mt-3 text-sm text-muted-foreground">Status: {need.status}</p></CardContent></Card>)}</div> : <Card><CardContent className="py-10 text-center"><p className="text-muted-foreground">You have not published a need yet.</p></CardContent></Card>}
  </div>;
}
