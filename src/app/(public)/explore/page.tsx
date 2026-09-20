import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ExplorePage() {
  return <PageWrapper title="Explore" className="max-w-4xl mx-auto"><Card><CardHeader><CardTitle>Community discovery</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Public discovery is intentionally limited. Create an account to publish a need or offer and discover compatible members inside the authenticated network.</p></CardContent></Card></PageWrapper>;
}
