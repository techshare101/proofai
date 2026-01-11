'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link href="/" className="text-white/80 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold">Terms of Service</h1>
          <p className="text-white/80 mt-2">Last updated: January 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-900 text-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance</h2>
              <p className="text-gray-300 leading-relaxed">
                By using ProofAI, you agree to these terms. If you do not agree, do not use the service.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. What ProofAI Is</h2>
              <p className="text-gray-300 leading-relaxed">
                ProofAI provides tools for recording, organizing, and generating reports from user-submitted evidence.
                We do not provide legal advice.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Responsibilities</h2>
              <ul className="text-gray-300 leading-relaxed space-y-2 list-disc list-inside">
                <li>You are responsible for the content you record or upload.</li>
                <li>You must comply with local recording and consent laws.</li>
                <li>You may not use ProofAI for harassment, falsification, or illegal activity.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Ownership</h2>
              <ul className="text-gray-300 leading-relaxed space-y-2 list-disc list-inside">
                <li>You own your recordings and reports.</li>
                <li>You grant ProofAI permission to process them solely to provide the service.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Subscriptions & Purchases</h2>
              <ul className="text-gray-300 leading-relaxed space-y-2 list-disc list-inside">
                <li>Subscription plans renew monthly unless canceled.</li>
                <li>One-time purchases (Emergency Pack, Court Certification) do not renew.</li>
                <li>Fees are non-refundable except where required by law.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Availability</h2>
              <p className="text-gray-300 leading-relaxed">
                We strive for reliability but do not guarantee uninterrupted service.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-300 leading-relaxed">
                ProofAI is provided "as is." We are not liable for indirect or consequential damages.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Termination</h2>
              <p className="text-gray-300 leading-relaxed">
                We may suspend accounts for misuse or violations.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Contact</h2>
              <p className="text-gray-300 leading-relaxed">
                Questions about these terms? Reach us at{' '}
                <a href="mailto:support@metalmindtech.com" className="text-purple-400 hover:text-purple-300 underline">
                  support@metalmindtech.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
