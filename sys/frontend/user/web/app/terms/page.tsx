import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - ChatShare.dev",
  description: "Terms of Service for ChatShare.dev",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      <header className="bg-[#A8B896] py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white">ChatShare</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Terms of Service
          </h1>
          <p className="text-gray-500 mb-8">Last Updated: January 2025</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using ChatShare, you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do
              not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              2. User-Generated Content Policy
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ChatShare has zero tolerance for objectionable content or abusive
              users. You agree not to post, share, or transmit any content that:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Is illegal, harmful, threatening, abusive, or harassing</li>
              <li>Contains hate speech or promotes discrimination</li>
              <li>Is sexually explicit or pornographic</li>
              <li>Contains violence or graphic content</li>
              <li>Infringes on intellectual property rights</li>
              <li>Contains spam, malware, or phishing attempts</li>
              <li>Impersonates others or spreads misinformation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. Content Moderation
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We employ automated content filters and manual review processes.
              Content that violates our policies may be flagged for review or
              removed without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              4. Reporting Objectionable Content
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you encounter content that violates these terms, please report
              it using the report feature. We commit to reviewing all reports
              within 24 hours and taking appropriate action, which may include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Removing the offending content</li>
              <li>Warning the user</li>
              <li>Suspending or terminating user accounts</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              5. Blocking Users
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You can block other users to prevent them from appearing in your
              feed. Blocked users will not be able to see your content or
              interact with you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              6. User Responsibilities
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You are responsible for all content you post and for maintaining
              the confidentiality of your account. You agree to notify us
              immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              7. Consequences of Violations
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Violations of these terms may result in:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Content removal</li>
              <li>Account suspension</li>
              <li>Permanent account termination</li>
              <li>Legal action where appropriate</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              8. Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Your use of ChatShare is also governed by our Privacy Policy.
              Please review it to understand how we collect, use, and protect
              your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              9. Changes to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these terms from time to time. Continued use of the
              service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              10. Contact
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about these terms or need to report an
              issue, please contact us at{" "}
              <a
                href="mailto:support@chatshare.dev"
                className="text-[#A8B896] hover:underline"
              >
                support@chatshare.dev
              </a>
            </p>
          </section>
        </article>
      </main>

      <footer className="bg-[#A8B896] py-6 px-4 mt-8">
        <div className="max-w-4xl mx-auto text-center text-white">
          <p>&copy; 2025 ChatShare.dev. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
