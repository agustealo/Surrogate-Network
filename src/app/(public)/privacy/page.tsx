import type { Metadata } from 'next'
import { PageWrapper } from '@/components/layout/PageWrapper'

export const metadata: Metadata = {
  title: 'Privacy Notice - Surrogate Network',
  description: 'Privacy information for the Surrogate Network consumer trial.',
}

const effectiveDate = 'September 20, 2026'

export default function PrivacyPage() {
  return (
    <PageWrapper title="Consumer Trial Privacy Notice" className="mx-auto max-w-4xl">
      <article className="prose prose-neutral max-w-none dark:prose-invert">
        <p><strong>Effective:</strong> {effectiveDate}</p>
        <p>
          This notice describes how the Surrogate Network consumer trial handles information when you create an account,
          publish Needs or Offers, form a connection, schedule interactions, submit feedback, or use safety controls.
        </p>

        <h2>Information the trial processes</h2>
        <p>
          Account information includes your name, email address, authentication data, and account status. Profile information
          can include your avatar, bio, general location, availability, boundaries, and other details you choose to provide.
          Marketplace and relationship data includes Needs, Offers, proposals, connections, Moments, Exchanges, feedback,
          blocks, reports, and the audit records required to operate and protect the service.
        </p>

        <h2>How information is used</h2>
        <p>
          Information is used to authenticate you, operate the marketplace and relationship lifecycle, enforce boundaries and
          access rules, prevent abuse, investigate reports, preserve security evidence, maintain service reliability, and improve
          the consumer trial. The trial does not require advertising-profile data to operate.
        </p>

        <h2>What other members can see</h2>
        <p>
          Your private profile row, including your email address and authoritative account fields, is not exposed as another
          member&apos;s profile. Other members can receive a limited public profile projection and can see marketplace or relationship
          information when the application&apos;s access rules permit it. Active Needs and Offers are intended for discovery by signed-in
          members. Blocks restrict future discovery and pairing between the affected accounts.
        </p>

        <h2>Service providers and storage</h2>
        <p>
          The current trial uses Supabase for authentication and persisted application data. Information may therefore be processed
          by infrastructure providers needed to run the service. Access inside the application is restricted through authenticated
          server actions, database permissions, and row-level security policies according to the type of record.
        </p>

        <h2>Safety, audit, and retention</h2>
        <p>
          Some records may be retained when necessary for security, fraud prevention, dispute handling, moderation, or audit integrity.
          For example, security audit events are designed to survive account deletion with the former actor identifier removed. Trial
          records should not be treated as an appropriate place for secrets, financial credentials, government identifiers, or other
          information that is unnecessary for a connection.
        </p>

        <h2>Your choices</h2>
        <p>
          You control the profile and marketplace information you choose to publish, and you can use in-product blocking and reporting
          controls. During the trial, requests to access, correct, deactivate, or delete account information should be made through the
          same trial-support channel through which access to the trial was provided. Some information may need to be retained where
          required for security, legal obligations, or the integrity of other members&apos; records.
        </p>

        <h2>Trial changes</h2>
        <p>
          The product and this notice may change during the consumer trial. Material changes should be reflected by a new effective
          date before the updated terms are used for new trial participation.
        </p>
      </article>
    </PageWrapper>
  )
}
