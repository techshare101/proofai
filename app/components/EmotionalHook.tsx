'use client';

export default function EmotionalHook() {
  return (
    <section className="py-16 bg-indigo-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-6">
          For the Voiceless. The Disrespected. The Overworked.
        </h2>
        <p className="text-xl leading-relaxed">
          Because if it didn't happen on ProofAI, it didn't happen.
        </p>
        <div className="mt-8 inline-flex items-center justify-center">
          <div className="h-px w-16 bg-indigo-300 mx-4"></div>
          <svg className="h-8 w-8 text-indigo-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 11V7a5 5 0 0110 0v4"></path>
            <path d="M5 11h14a2 2 0 012 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 012-2z"></path>
          </svg>
          <div className="h-px w-16 bg-indigo-300 mx-4"></div>
        </div>
      </div>
    </section>
  );
}
