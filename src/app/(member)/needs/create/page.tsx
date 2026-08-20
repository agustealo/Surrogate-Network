
import { PageWrapper } from '@/components/layout/PageWrapper';
import { NeedCreatorForm } from '@/components/forms/NeedCreatorForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Define Your Need - Surrogate Network',
  description: 'Use our AI tool to define and tag your needs for better matching on Surrogate Network.',
};

export default function CreateNeedPage() {
  const handleTagsFinalized = async (tags: string[]) => {
    'use server';
    console.log("Finalized tags (server-side):", tags);
    // Here you would typically associate these tags with a new or existing request item for the user.
    // For example, save to a database.
  };

  return (
    <PageWrapper title="Define a New Need" className="max-w-3xl mx-auto">
      <p className="mb-8 text-muted-foreground">
        Clearly defining your needs is the first step to finding the right support on Surrogate Network. 
        Describe your need below, and let our AI assist you in generating relevant tags.
      </p>
      <NeedCreatorForm onTagsGenerated={handleTagsFinalized} />
    </PageWrapper>
  );
}
