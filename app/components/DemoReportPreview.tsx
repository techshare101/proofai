'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function DemoReportPreview() {
  return (
    <section id="demo" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Professional Legal Reports
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            See how ProofAI transforms your evidence into structured legal documentation.
          </p>
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* PDF Preview Column */}
            <div className="p-6 flex flex-col items-center justify-center">
              <div className="w-full max-w-md aspect-[3/4] relative bg-gray-100 border border-gray-200 shadow-md">
                {/* Placeholder for PDF preview - in production, use actual screenshot */}
                <div className="absolute inset-0 flex flex-col">
                  {/* PDF Header */}
                  <div className="bg-indigo-600 p-4 text-white">
                    <div className="text-lg font-bold">CASE REPORT</div>
                    <div className="text-sm">Case ID: DEMO-12345</div>
                  </div>
                  
                  {/* PDF Content Mockup */}
                  <div className="flex-grow p-4 flex flex-col">
                    <div className="border-b border-gray-300 pb-2 mb-4">
                      <h3 className="font-bold">REPORT SUMMARY</h3>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-5/6"></div>
                      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                    </div>
                    
                    <div className="border-b border-gray-300 pb-2 mb-4">
                      <h3 className="font-bold">TRANSCRIPT</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-300 rounded w-full"></div>
                      <div className="h-3 bg-gray-300 rounded w-4/5"></div>
                      <div className="h-3 bg-gray-300 rounded w-5/6"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                    
                    {/* QR Code at bottom */}
                    <div className="mt-auto pt-4 flex justify-center">
                      <div className="w-16 h-16 bg-green-100 flex items-center justify-center">
                        <div className="w-12 h-12 bg-gray-800"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Features Column */}
            <div className="bg-gray-50 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Every Detail Matters
              </h3>
              <ul className="space-y-4">
                <li className="flex">
                  <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">
                    <strong>Automated Transcription</strong> - Every word captured and formatted
                  </span>
                </li>
                <li className="flex">
                  <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">
                    <strong>Geolocation Data</strong> - Precise location information
                  </span>
                </li>
                <li className="flex">
                  <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">
                    <strong>QR Code Access</strong> - Scan to instantly access video evidence
                  </span>
                </li>
                <li className="flex">
                  <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">
                    <strong>Legal Formatting</strong> - Court-ready documentation
                  </span>
                </li>
                <li className="flex">
                  <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">
                    <strong>AI Summarization</strong> - Key points highlighted automatically
                  </span>
                </li>
              </ul>
              
              <div className="mt-8">
                <Link 
                  href="/login"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Your First Report
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
