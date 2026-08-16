
import { PageWrapper } from '@/components/layout/PageWrapper';
import { SignUpForm } from '@/components/forms/SignUpForm';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Sign Up - Surrogate Network',
  description: 'Create your Surrogate Network account to start connecting.',
};

export default function SignUpPage() {
  const handleSignUp = (data: any) => {
    // In a real app, you would register the user here
    console.log('Sign up attempt with:', data);
    // Redirect to profile creation or dashboard upon successful sign-up
  };

  return (
    <PageWrapper title="Create Your Account" className="max-w-md mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Join Surrogate Network</CardTitle>
          <CardDescription>Start your journey by creating an account. It's quick and easy!</CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm onSubmit={handleSignUp} />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
