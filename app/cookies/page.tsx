'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link href="/" className="text-white/80 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold">Cookie Policy</h1>
          <p className="text-white/80 mt-2">Last updated: January 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-900 text-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="space-y-8">
            {/* What Cookies We Use */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">What Cookies We Use</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                ProofAI uses cookies to:
              </p>
              <ul className="text-gray-300 leading-relaxed space-y-2 list-disc list-inside">
                <li>Keep you logged in</li>
                <li>Secure sessions</li>
                <li>Measure performance</li>
              </ul>
            </section>

            {/* No Advertising */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">No Advertising Trackers</h2>
              <p className="text-gray-300 leading-relaxed">
                We do not use advertising trackers. Your browsing activity is not shared with advertisers.
              </p>
            </section>

            {/* Managing Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Managing Cookies</h2>
              <p className="text-gray-300 leading-relaxed">
                You can disable cookies in your browser, but some features may not work as expected.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact</h2>
              <p className="text-gray-300 leading-relaxed">
                Questions about cookies? Reach us at{' '}
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
