import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MessagesPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6"><h1 className="text-3xl font-bold">Messages</h1><p className="text-muted-foreground">Private messaging is not enabled until its persisted thread/message model, RLS policies, abuse controls, and media permissions are deployed.</p></div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Messaging unavailable</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-muted-foreground">No conversations are fabricated while the production messaging subsystem is being completed. Continue through Needs, Offers, and Surrogacies.</p><Button asChild><Link href="/discover">Discover connections</Link></Button></CardContent></Card>
    </div>
  );
}
