import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const steps = [
  ['1. State a Need', 'Describe the support, companionship, or capability you are looking for, including timing and boundaries.'],
  ['2. Publish an Offer', 'Share what you are willing and able to provide.'],
  ['3. Discover', 'Find compatible needs and offers without reducing people to a swipe.'],
  ['4. Propose', 'Agree on expectations before a relationship becomes active.'],
  ['5. Build a Surrogacy', 'Schedule moments, complete exchanges, and use feedback to build trust.'],
];

export default function HowItWorksPage() {
  return <PageWrapper title="How It Works" className="max-w-4xl mx-auto"><div className="grid gap-4">{steps.map(([title, body]) => <Card key={title}><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{body}</p></CardContent></Card>)}</div></PageWrapper>;
}
