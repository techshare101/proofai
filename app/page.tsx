'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';

// Import components
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import EmotionalHook from '@/components/EmotionalHook';
import DemoReportPreview from '@/components/DemoReportPreview';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';


export default function Home() {
  const { isLoading } = useAuth();

  // During loading or SSR, show loading indicator
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col">
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 border-2 border-indigo-500 rounded-full animate-spin"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <Hero />
      
      {/* How It Works */}
      <HowItWorks />
      
      {/* Emotional Hook */}
      <EmotionalHook />
      
      {/* Demo Report Preview */}
      <DemoReportPreview />
      
      {/* Pricing */}
      <Pricing />
      
      {/* Footer */}
      <Footer />
    </main>
  );
}
