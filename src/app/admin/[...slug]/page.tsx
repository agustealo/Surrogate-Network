import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminPlaceholderPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join('/');
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Admin Section: {path}</CardTitle>
          <CardDescription>
            This administrative section is planned but not yet implemented.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The {path} section will be implemented in a future sprint. 
            This page serves as a placeholder to demonstrate the routing structure.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}