'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center md:text-left md:max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Capture Proof. Protect Yourself.
          </h1>
          <p className="mt-6 text-xl md:text-2xl">
            Secure video evidence. Instant legal reports. For workers and citizens.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row sm:justify-center md:justify-start gap-4">
            <Link 
              href="/login"
              className="rounded-md bg-white px-6 py-3 text-base font-medium text-indigo-600 shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white text-center"
            >
              Record Now
            </Link>
            <a
              href="#demo"
              className="rounded-md bg-indigo-800 bg-opacity-40 px-6 py-3 text-base font-medium text-white hover:bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-white text-center"
            >
              Watch Demo
            </a>
          </div>
        </div>
      </div>
      
      {/* Background decorative elements */}
      <div className="absolute inset-y-0 right-0 hidden lg:block lg:w-1/3">
        <svg
          className="h-full w-full text-white text-opacity-20"
          fill="currentColor"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polygon points="0,0 100,0 50,100 0,100" />
        </svg>
      </div>
    </div>
  );
}
