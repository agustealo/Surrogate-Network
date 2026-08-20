import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MemberPlaceholderPageProps {
  title: string;
  description: string;
}

export function MemberPlaceholderPage({ title, description }: MemberPlaceholderPageProps) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>This member surface is part of the current shell and will gain full runtime behavior in SC-01.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
