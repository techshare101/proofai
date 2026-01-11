'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link href="/" className="text-white/80 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
          <p className="text-white/80 mt-2">Last updated: January 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-900 text-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="space-y-8">
            {/* What We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">What We Collect</h2>
              <ul className="text-gray-300 leading-relaxed space-y-2 list-disc list-inside">
                <li>Account info (email, authentication provider)</li>
                <li>Uploaded recordings and generated reports</li>
                <li>Usage data for improving the service</li>
              </ul>
            </section>

            {/* What We Do NOT Do */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">What We Do NOT Do</h2>
              <ul className="text-gray-300 leading-relaxed space-y-2">
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">✗</span>
                  Sell your data
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">✗</span>
                  Train public AI models on your content
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">✗</span>
                  Share evidence without your permission
                </li>
              </ul>
            </section>

            {/* How Data Is Used */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">How Data Is Used</h2>
              <ul className="text-gray-300 leading-relaxed space-y-2 list-disc list-inside">
                <li>To generate reports</li>
                <li>To provide secure storage</li>
                <li>To improve reliability and safety</li>
              </ul>
            </section>

            {/* Storage & Security */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Storage & Security</h2>
              <ul className="text-gray-300 leading-relaxed space-y-2 list-disc list-inside">
                <li>Files are stored securely</li>
                <li>Access is restricted to the account owner</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
              <ul className="text-gray-300 leading-relaxed space-y-2 list-disc list-inside">
                <li>Download your data</li>
                <li>Delete your account</li>
                <li>Request clarification anytime</li>
              </ul>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact</h2>
              <p className="text-gray-300 leading-relaxed">
                Questions about your privacy? Reach us at{' '}
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
