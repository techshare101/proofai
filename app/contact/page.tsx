'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link href="/" className="text-white/80 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold">Contact Us</h1>
          <p className="text-white/80 mt-2">We're here to help.</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-900 text-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          {/* Contact Card */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 max-w-xl mx-auto text-center">
            <div className="text-5xl mb-6">📧</div>
            <h2 className="text-2xl font-semibold text-white mb-4">Primary Contact</h2>
            <a
              href="mailto:support@metalmindtech.com"
              className="text-2xl text-purple-400 hover:text-purple-300 underline font-medium"
            >
              support@metalmindtech.com
            </a>
            <p className="text-gray-400 mt-6">
              We typically respond within 24 hours.
            </p>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center text-gray-500">
            <p>
              For urgent matters, please include "URGENT" in your email subject line.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
