'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';

const docSections = [
  {
    title: 'Recording Evidence',
    description: 'How to capture video and audio evidence securely using ProofAI.',
    icon: '🎥',
  },
  {
    title: 'Report Generation',
    description: 'Understanding how AI-powered reports are created from your recordings.',
    icon: '📊',
  },
  {
    title: 'Plan Limits',
    description: 'Storage limits, recording duration, and feature availability by plan.',
    icon: '📋',
  },
  {
    title: 'Court Certification',
    description: 'How court-ready certification works and when to use it.',
    icon: '⚖️',
  },
  {
    title: 'Data Security',
    description: 'How we protect your evidence with encryption and secure storage.',
    icon: '🔐',
  },
];

export default function Documentation() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link href="/" className="text-white/80 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold">Documentation</h1>
          <p className="text-white/80 mt-2">How ProofAI works under the hood.</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-900 text-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          {/* Doc Sections */}
          <div className="space-y-4">
            {docSections.map((section) => (
              <div
                key={section.title}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors border border-gray-700 flex items-start"
              >
                <div className="text-2xl mr-4 mt-1">{section.icon}</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{section.title}</h3>
                  <p className="text-gray-400">{section.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Coming Soon Note */}
          <div className="mt-12 text-center text-gray-500">
            <p>Detailed documentation is being expanded. Check back soon for in-depth guides.</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
