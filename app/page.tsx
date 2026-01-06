/**
 * 🚨 CANONICAL FILE — DO NOT MODIFY 🚨
 * 
 * 🔒 LANDING PAGE - 100% STATIC MARKETING PAGE
 * 
 * ABSOLUTE RULES:
 * ❌ No auth checks (useAuth, useSession, getUser)
 * ❌ No plan checks (useUserPlan)
 * ❌ No redirects (router.push, router.replace)
 * ❌ No Supabase session logic
 * ❌ No useEffect with auth dependencies
 * 
 * ✅ Only: Hero, Features, CTA buttons, Static content
 * 
 * This page is a PUBLIC marketing site.
 * Auth redirects are handled by middleware, NOT this page.
 */

// Import components
import Hero from '@/components/Hero';
import FeaturesEmpower from '@/components/FeaturesEmpower';
import HowItWorks from '@/components/HowItWorks';
import EmotionalHook from '@/components/EmotionalHook';
import DemoReportPreview from '@/components/DemoReportPreview';
import WhoIsItFor from '@/components/WhoIsItFor';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';

// Force static rendering - no reactive auth logic
export const dynamic = 'force-static';

export default function Home() {
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
