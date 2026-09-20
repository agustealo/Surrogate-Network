import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SafetyPage() {
  return <PageWrapper title="Safety" className="max-w-4xl mx-auto"><div className="grid gap-4">
    <Card><CardHeader><CardTitle>Consent and boundaries</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Needs, offers, proposals, and media access are explicit. A connection never overrides a member&apos;s boundaries or right to end an interaction.</p></CardContent></Card>
    <Card><CardHeader><CardTitle>Report concerns</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Use in-product reporting for harassment, impersonation, boundary violations, spam, or inappropriate content. Urgent physical danger should be handled through local emergency services.</p></CardContent></Card>
    <Card><CardHeader><CardTitle>Protect personal information</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Keep sensitive personal, financial, and location information private until you have a reason to share it. Media access and private relationship data are permission-scoped.</p></CardContent></Card>
  </div></PageWrapper>;
}
