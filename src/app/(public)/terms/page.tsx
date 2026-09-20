import type { Metadata } from 'next'
import { PageWrapper } from '@/components/layout/PageWrapper'

export const metadata: Metadata = {
  title: 'Trial Terms - Surrogate Network',
  description: 'Terms for participation in the Surrogate Network consumer trial.',
}

const effectiveDate = 'September 20, 2026'

export default function TermsPage() {
  return (
    <PageWrapper title="Consumer Trial Terms" className="mx-auto max-w-4xl">
      <article className="prose prose-neutral max-w-none dark:prose-invert">
        <p><strong>Effective:</strong> {effectiveDate}</p>
        <p>
          These terms apply to participation in the Surrogate Network consumer trial. The trial is an evolving service for matching
          member Needs and Offers, exchanging proposals, forming consent-based connections, scheduling Moments, recording Exchanges,
          and leaving feedback.
        </p>

        <h2>Eligibility</h2>
        <p>
          Trial participants must be at least 18 years old and able to agree to these terms. Do not create an account for another
          person or impersonate another person.
        </p>

        <h2>Consent and boundaries</h2>
        <p>
          A proposal, accepted connection, scheduled Moment, or prior interaction never creates continuing consent. Every participant
          remains responsible for respecting the other person&apos;s stated boundaries and for stopping an interaction when consent is
          withdrawn. The platform does not authorize physical, romantic, financial, professional, medical, or other conduct merely
          because two accounts were matched.
        </p>

        <h2>Trial conduct</h2>
        <p>
          Do not use the service for harassment, threats, stalking, discrimination, sexual exploitation, non-consensual conduct,
          impersonation, fraud, spam, illegal activity, attempts to bypass access controls, or collection of another person&apos;s private
          information without permission. Do not upload credentials, payment-card data, government identifiers, malware, or content
          you do not have the right to share.
        </p>

        <h2>Safety controls and moderation</h2>
        <p>
          Members can block and report other members. Blocking is intended to stop future discovery and pairing between the affected
          accounts. Reports may be reviewed for safety and moderation purposes. Accounts can be restricted or suspended when necessary
          to protect the trial, its members, or its systems. In an emergency or immediate physical danger, contact local emergency
          services rather than relying on the application.
        </p>

        <h2>Your content and responsibilities</h2>
        <p>
          You are responsible for the accuracy and legality of the information you publish and for deciding whether an interaction is
          appropriate for you. You retain responsibility for your own content. You grant the service permission to store, display, and
          process that content as necessary to operate, secure, and evaluate the trial.
        </p>

        <h2>Experimental service</h2>
        <p>
          This is a consumer trial, not a promise of uninterrupted availability or a guarantee that another member is suitable,
          verified, safe, qualified, or able to perform a particular task. Features may be changed, limited, or removed as the product
          is tested. Features that are not backed by a deployed persistence, permission, and safety model are intentionally not exposed
          as available trial capabilities.
        </p>

        <h2>Account restrictions and ending participation</h2>
        <p>
          Access may be suspended or ended for material violations of these terms, abuse of other members, security risks, or threats
          to the integrity of the trial. You may stop participating at any time. Account-data requests should be made through the trial
          support channel through which access was provided. Certain security, moderation, dispute, or audit records may need to be
          retained after participation ends.
        </p>

        <h2>Privacy</h2>
        <p>
          The Consumer Trial Privacy Notice describes the categories of information the trial processes, how member-visible data is
          separated from private account data, and the role of safety and audit records.
        </p>
      </article>
    </PageWrapper>
  )
}
