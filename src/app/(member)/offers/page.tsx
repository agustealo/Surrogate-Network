import Link from 'next/link';
import { createClient } from '@/infrastructure/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function MemberOffersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: offers, error } = await supabase.from('offers').select('id,title,description,status,created_at').eq('user_id', user!.id).order('created_at', { ascending: false });
  if (error) throw new Error('Unable to load your offers.');

  return <div className="container mx-auto max-w-5xl px-4 py-6"><div className="mb-6 flex items-center justify-between"><div><h1 className="text-3xl font-bold">Offers</h1><p className="text-muted-foreground">What you are currently willing and able to provide.</p></div><Button asChild><Link href="/offers/create">Create offer</Link></Button></div>
    {offers?.length ? <div className="grid gap-4">{offers.map((offer) => <Card key={offer.id}><CardHeader><CardTitle>{offer.title}</CardTitle></CardHeader><CardContent><p>{offer.description}</p><p className="mt-3 text-sm text-muted-foreground">Status: {offer.status}</p></CardContent></Card>)}</div> : <Card><CardContent className="py-10 text-center"><p className="text-muted-foreground">You have not published an offer yet.</p></CardContent></Card>}
  </div>;
}
