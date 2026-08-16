
import { PageWrapper } from '@/components/layout/PageWrapper';
import { FeedbackForm } from '@/components/forms/FeedbackForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Submit Feedback - Surrogate Network',
  description: 'Provide feedback on your experience with a surrogate connection.',
};

export default function SubmitFeedbackPage() {
  // In a real app, you might pass companion details or match ID to the form.
  // For now, it's a generic feedback form.
  const handleFeedbackSubmission = (data: any) => {
    console.log("Feedback page received data:", data);
    // Logic to save feedback to a database
  };

  return (
    <PageWrapper title="Submit Your Feedback" className="max-w-xl mx-auto">
      <p className="mb-8 text-muted-foreground">
        Your insights are valuable. Please share your experience to help maintain a trustworthy and supportive community.
        This feedback is for a recent interaction (in a real app, this would be more specific).
      </p>
      <FeedbackForm companionName="your recent connection" onFeedbackSubmit={handleFeedbackSubmission} />
    </PageWrapper>
  );
}
