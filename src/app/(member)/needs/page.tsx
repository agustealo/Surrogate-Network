import Link from 'next/link';
import { redirect } from 'next/navigation';
import { routes } from '@/lib/routes';
import { createClient } from '@/infrastructure/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function MemberNeedsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(routes.public.login);
  const { data: needs, error } = await supabase.from('needs').select('id,title,description,status,created_at').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) throw new Error('Unable to load your needs.');

  return <div className="container mx-auto max-w-5xl px-4 py-6"><div className="mb-6 flex items-center justify-between"><div><h1 className="text-3xl font-bold">Needs</h1><p className="text-muted-foreground">What you are currently asking the network to help fulfill.</p></div><Button asChild><Link href={routes.member.needsCreate}>Create Need</Link></Button></div>
    {needs?.length ? <div className="grid gap-4">{needs.map((need) => <Card key={need.id}><CardHeader><CardTitle>{need.title}</CardTitle></CardHeader><CardContent><p>{need.description}</p><p className="mt-3 text-sm text-muted-foreground">Status: {need.status}</p><Button asChild size="sm" variant="outline" className="mt-3"><Link href={routes.memberDynamic.need(need.id)}>View Need</Link></Button></CardContent></Card>)}</div> : <Card><CardContent className="py-10 text-center"><div className="space-y-3"><p className="text-muted-foreground">You have not published a need yet.</p><Button asChild><Link href={routes.member.needsCreate}>Create your first Need</Link></Button><div><Link href={routes.member.discover} className="text-sm font-medium underline">Explore Discover</Link></div></div></CardContent></Card>}
  </div>;
}
