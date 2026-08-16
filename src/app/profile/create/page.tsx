
import { PageWrapper } from '@/components/layout/PageWrapper';
import { ProfileForm } from '@/components/forms/ProfileForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Profile - Surrogate Network',
  description: 'Create your Surrogate Network profile to start connecting.',
};

export default function CreateProfilePage() {
  return (
    <PageWrapper title="Create Your Profile" className="max-w-3xl mx-auto">
      <p className="mb-8 text-muted-foreground">
        Share your offerings and requests to find or become a connection on Surrogate Network. 
        Your profile helps us match you with compatible individuals.
      </p>
      <ProfileForm />
    </PageWrapper>
  );
}
