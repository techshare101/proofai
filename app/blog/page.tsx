'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';

export default function Blog() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link href="/" className="text-white/80 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold">Blog</h1>
          <p className="text-white/80 mt-2">Justice, technology, and truth.</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-900 text-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          {/* Empty State */}
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📝</div>
            <h2 className="text-2xl font-semibold text-white mb-4">Our first stories are coming soon.</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              We're preparing thoughtful content about justice, technology, and the power of truth.
              Check back soon.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
