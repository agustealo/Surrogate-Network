import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PublicPlaceholderPageProps {
  title: string;
  description: string;
}

export function PublicPlaceholderPage({ title, description }: PublicPlaceholderPageProps) {
  return (
    <PageWrapper title={title} className="max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>This public surface is now routed through the public shell and will be expanded in upcoming slices.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
