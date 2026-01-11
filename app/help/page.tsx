'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';

const helpSections = [
  {
    title: 'Getting Started',
    description: 'Learn how to set up your account and record your first incident.',
    icon: '🚀',
  },
  {
    title: 'Billing & Plans',
    description: 'Understand subscription options, upgrades, and payment methods.',
    icon: '💳',
  },
  {
    title: 'Evidence & Reports',
    description: 'How to record, organize, and generate legal reports from your evidence.',
    icon: '📄',
  },
  {
    title: 'Account & Security',
    description: 'Manage your account settings, password, and data privacy.',
    icon: '🔒',
  },
];

export default function HelpCenter() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link href="/" className="text-white/80 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold">Help Center</h1>
          <p className="text-white/80 mt-2">Get help when you need it — fast.</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-900 text-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          {/* Help Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {helpSections.map((section) => (
              <div
                key={section.title}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors border border-gray-700"
              >
                <div className="text-3xl mb-3">{section.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{section.title}</h3>
                <p className="text-gray-400">{section.description}</p>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-8 text-center border border-purple-700/30">
            <h2 className="text-2xl font-semibold text-white mb-4">Still need help?</h2>
            <p className="text-gray-300 mb-6">
              Our support team is here to assist you.
            </p>
            <a
              href="mailto:support@metalmindtech.com"
              className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              📧 support@metalmindtech.com
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
