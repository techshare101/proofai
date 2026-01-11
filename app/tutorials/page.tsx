'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';

const tutorials = [
  {
    title: 'Record your first incident',
    description: 'Step-by-step guide to capturing your first piece of evidence.',
    status: 'coming-soon',
    icon: '🎬',
  },
  {
    title: 'Generate a legal report',
    description: 'How to create an AI-powered report from your recordings.',
    status: 'coming-soon',
    icon: '📝',
  },
  {
    title: 'Upgrade your plan',
    description: 'Unlock more storage and features with a subscription upgrade.',
    status: 'coming-soon',
    icon: '⬆️',
  },
  {
    title: 'Download and share evidence',
    description: 'Export your recordings and reports for legal use.',
    status: 'coming-soon',
    icon: '📤',
  },
];

export default function Tutorials() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link href="/" className="text-white/80 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold">Tutorials</h1>
          <p className="text-white/80 mt-2">Learn by doing.</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-900 text-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          {/* Tutorial Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tutorials.map((tutorial) => (
              <div
                key={tutorial.title}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 relative overflow-hidden"
              >
                <div className="text-3xl mb-3">{tutorial.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{tutorial.title}</h3>
                <p className="text-gray-400 mb-4">{tutorial.description}</p>
                {tutorial.status === 'coming-soon' && (
                  <span className="inline-block bg-purple-900/50 text-purple-300 text-sm px-3 py-1 rounded-full border border-purple-700/50">
                    Coming Soon
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Note */}
          <div className="mt-12 text-center text-gray-500">
            <p>More tutorials are on the way. Stay tuned!</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
