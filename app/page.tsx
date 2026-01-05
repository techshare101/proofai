/**
 * 🔒 LANDING PAGE - Marketing only
 * Authenticated users are redirected to /dashboard via AuthContext.
 * This page should NEVER render app UI or trigger legacy routing.
 */
'use client';

import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Import components
import Hero from '@/components/Hero';
import FeaturesEmpower from '@/components/FeaturesEmpower';
import HowItWorks from '@/components/HowItWorks';
import EmotionalHook from '@/components/EmotionalHook';
import DemoReportPreview from '@/components/DemoReportPreview';
import WhoIsItFor from '@/components/WhoIsItFor';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';


export default function Home() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  // Immediate redirect for authenticated users - prevents any flash
  useEffect(() => {
    if (!isLoading && session) {
      router.replace('/dashboard');
    }
  }, [session, isLoading, router]);

  // During loading or if authenticated, show loading indicator (prevents flash)
  if (isLoading || session) {
    return (
      <main className="flex min-h-screen flex-col">
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 border-2 border-indigo-500 rounded-full animate-spin"></div>
        </div>
      </main>
    );
  }

  // Only show marketing page for unauthenticated users
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <Hero />
      
      {/* Features That Empower */}
      <FeaturesEmpower />
      
      {/* How It Works */}
      <HowItWorks />
      
      {/* Emotional Hook */}
      <EmotionalHook />
      
      {/* Demo Report Preview */}
      <DemoReportPreview />
      
      {/* Who Is It For */}
      <WhoIsItFor />
      
      {/* Pricing */}
      <Pricing />
      
      {/* Footer */}
      <Footer />
    </main>
  );
}
