import type { Metadata } from 'next';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { LoginForm } from '@/components/forms/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Sign In - Surrogate Network',
  description: 'Sign in to your Surrogate Network account.',
};

export default function LoginPage() {
  return (
    <PageWrapper title="Account Login" className="max-w-md mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to continue.</CardDescription>
        </CardHeader>
        <CardContent><LoginForm /></CardContent>
      </Card>
    </PageWrapper>
  );
}
