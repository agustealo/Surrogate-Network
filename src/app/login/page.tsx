
'use client'; 

import { PageWrapper } from '@/components/layout/PageWrapper';
import { LoginForm } from '@/components/forms/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react'; 

export default function LoginPage() {
  useEffect(() => {
    document.title = 'Login - Surrogate Network';
  }, []);

  const handleLogin = (data: any) => {
    // In a real app, you would authenticate the user here
    console.log('Login attempt with:', data);
    // Redirect to a dashboard or home page upon successful login
  };

  return (
    <PageWrapper title="Account Login" className="max-w-md mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your account and continue your journey on Surrogate Network.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSubmit={handleLogin} />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
