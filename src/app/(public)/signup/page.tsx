import { PageWrapper } from '@/components/layout/PageWrapper';
import { SignUpForm } from '@/components/forms/SignUpForm';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Sign Up - Surrogate Network',
  description: 'Create your Surrogate Network account to start connecting.',
};

export default function SignUpPage() {
  return (
    <PageWrapper title="Create Your Account" className="max-w-md mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Join Surrogate Network</CardTitle>
          <CardDescription>Start your journey by creating an account. It's quick and easy!</CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
