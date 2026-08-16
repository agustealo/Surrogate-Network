
import { PageWrapper } from '@/components/layout/PageWrapper';
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Recycle, Handshake, BookHeart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community Principles - Surrogate Network',
  description: 'The core values and charter of the Surrogate Network community.',
};

const principles = [
    {
        icon: <ShieldCheck className="h-10 w-10 text-primary" />,
        title: 'Safety & Respect',
        description: 'Our community is a space for safe and respectful interaction. We prioritize clear boundaries, consent-based connections, and provide tools for reporting and conflict resolution. We are committed to protecting our members.'
    },
    {
        icon: <Handshake className="h-10 w-10 text-primary" />,
        title: 'Transparency & Honesty',
        description: 'Clarity is kindness. We encourage members to be upfront and honest about their needs, their offerings, and their boundaries. This creates a foundation of trust and prevents misunderstandings.'
    },
    {
        icon: <Recycle className="h-10 w-10 text-primary" />,
        title: 'Mutuality & Reciprocity',
        description: 'Surrogate Network is a co-op, not a service. We thrive on the balance of giving and receiving. We encourage members to both offer their strengths and ask for help, fostering a healthy, interdependent ecosystem.'
    }
]

export default function PrinciplesPage() {
  return (
    <PageWrapper title="Our Co-op Charter" className="max-w-4xl mx-auto">
        <Card className="bg-muted/20 border-none shadow-none">
            <CardHeader className="text-center">
                <BookHeart className="h-16 w-16 text-primary mx-auto mb-4" />
                <CardTitle className="text-4xl font-bold">The Principles of Connection</CardTitle>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto pt-2">
                    Surrogate Network operates as a community cooperative built on a shared understanding. These principles guide our interactions and ensure the health of our ecosystem.
                </p>
            </CardHeader>
        </Card>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {principles.map(p => (
                <Card key={p.title} className="text-center shadow-lg hover:shadow-primary/20 transition-shadow">
                    <CardHeader className="items-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                           {p.icon}
                        </div>
                        <CardTitle>{p.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{p.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>

        <div className="mt-16 text-center">
            <h3 className="text-2xl font-semibold">Your Commitment</h3>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                By participating in Surrogate Network, you agree to uphold these principles in all your interactions. Together, we build a better way to connect.
            </p>
        </div>
    </PageWrapper>
  );
}
