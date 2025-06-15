'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Import components
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import EmotionalHook from '@/components/EmotionalHook';
import DemoReportPreview from '@/components/DemoReportPreview';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';


export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Check for authenticated user and redirect if found
  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        // User is signed in, redirect to dashboard
        router.push('/dashboard');
      } else {
        // No authenticated user
        setLoading(false);
      }
    };
    
    checkUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        router.push('/dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
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
