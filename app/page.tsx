'use client';

import { useEffect } from 'react';
import Link from "next/link";
import { useAuth } from './contexts/AuthContext';
import dynamic from 'next/dynamic';

// Dynamically import components with no SSR to avoid hydration issues
const HeroIllustration = dynamic(
  () => import('./components/HeroIllustration'),
  { ssr: false }
);

const FeatureCard = dynamic(
  () => import('./components/FeatureCard'),
  { ssr: false }
);

export default function Home() {
  const { isLoading } = useAuth();

  // Smooth scroll for anchor links
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const element = document.querySelector(window.location.hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const features = [
    {
      title: "Military-Grade Security",
      description: "End-to-end encryption ensures your evidence remains private and tamper-proof with blockchain verification.",
      icon: "🔒",
      color: "purple"
    },
    {
      title: "Instant PDF Reports",
      description: "Generate court-ready documents with timestamps, geolocation, and metadata in seconds.",
      icon: "📄",
      color: "indigo"
    },
    {
      title: "Global Verification",
      description: "Blockchain-verified timestamps that hold up in legal proceedings worldwide.",
      icon: "🌐",
      color: "blue"
    },
    {
      title: "Cloud Backup",
      description: "Automatic cloud sync ensures your evidence is never lost, even if your device is.",
      icon: "☁️",
      color: "teal"
    },
    {
      title: "Team Collaboration",
      description: "Securely share and collaborate on evidence with your legal team or organization.",
      icon: "👥",
      color: "pink"
    },
    {
      title: "24/7 Support",
      description: "Round-the-clock assistance from our team of legal tech experts.",
      icon: "🛡️",
      color: "amber"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute inset-0" style={{ backgroundImage: 'var(--grid-pattern)', opacity: 0.05 }}></div>
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-600/10 to-transparent rounded-full filter blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-1/4 -left-1/4 w-[700px] h-[700px] bg-gradient-to-tr from-blue-600/10 to-transparent rounded-full filter blur-3xl animate-float-slower"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-600/5 to-purple-600/5 rounded-full filter blur-3xl animate-pulse-slow"></div>
      </div>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center pt-20 pb-32 px-6 md:px-12 lg:px-24 overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Left content */}
            <div className="max-w-2xl">
              <span className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs uppercase tracking-widest font-semibold px-4 py-2 rounded-full mb-6 shadow-lg">
                Your Story. Your Proof. Your Power.
              </span>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-100">
                Document truth. <br className="hidden md:block" />
                Defend dignity. <br className="hidden md:block" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500">
                  Your proof.
                </span>{' '}
                Your liberation.
              </h1>
              
              <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl">
                Secure video evidence and instant legal proof for workers, citizens, and defenders of justice. 
                Your story, captured and protected with military-grade encryption.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/recorder"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  🚀 Start Recording
                </Link>
                
                <Link
                  href="#pricing"
                  className="px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  💎 View Plans
                </Link>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    {['👩‍💼', '👨‍⚖️', '👩‍⚕️', '👨‍✈️'].map((emoji, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm border-2 border-gray-800">
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <span className="ml-3">Trusted by 10,000+ professionals</span>
                </div>
              </div>
            </div>
            
            {/* Right illustration */}
            <div className="relative w-full max-w-2xl mt-16 lg:mt-0">
              <HeroIllustration />
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-400 mb-2">Scroll to explore</span>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 px-6 relative bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="container mx-auto relative">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs uppercase tracking-widest font-semibold px-4 py-2 rounded-full mb-6 shadow-lg">
              Powerful Protection
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-100">
              Features That Empower Your Evidence
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Advanced tools to document, verify, and present evidence with unshakable confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                data-aos-duration="800"
              >
                <FeatureCard 
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                  color={feature.color}
                  index={index}
                />
              </div>
            ))}
          </div>
          
          {/* Floating elements */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full filter blur-3xl -z-10"></div>
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blue-500/10 rounded-full filter blur-3xl -z-10"></div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 px-6 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs uppercase tracking-widest font-semibold px-4 py-2 rounded-full mb-6">
              Simple, Transparent Pricing
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Choose the perfect <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">plan for you</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              No hidden fees, no contracts. Cancel anytime.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 max-w-7xl mx-auto">
            {/* Community Tier */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-2xl shadow-xl overflow-hidden border border-gray-700 hover:border-purple-500/50 transition-all duration-300 transform hover:-translate-y-2">
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold mb-2">Community</h3>
                <p className="text-gray-400 text-sm mb-4">Perfect for getting started</p>
                <div className="text-4xl font-bold mb-6">$4.99<span className="text-base text-gray-500">/month</span></div>
                <ul className="space-y-3 mb-8 text-left text-sm">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>5 recordings/month</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Basic PDF reports</span>
                  </li>
                </ul>
                <Link 
                  href="/signup" 
                  className="block w-full py-3 px-4 text-center rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition text-sm"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Self-Defender Tier - Featured */}
            <div className="relative lg:col-span-2">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl opacity-70 blur"></div>
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-purple-500/30 relative transform hover:-translate-y-2 transition-all duration-300 h-full">
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
                <div className="p-6 text-center h-full flex flex-col">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Self‑Defender</h3>
                    <p className="text-gray-400 text-sm mb-4">For individuals who need reliable protection</p>
                    <div className="text-5xl font-bold mb-6">$9.99<span className="text-base text-gray-400">/month</span></div>
                    <ul className="space-y-3 mb-8 text-left text-sm">
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Unlimited recordings</span>
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Advanced PDF reports</span>
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Priority support</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-auto">
                    <Link 
                      href="/signup?plan=pro" 
                      className="block w-full py-3 px-4 text-center rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold hover:opacity-90 transition text-sm"
                    >
                      Get Started Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Mission Partner Tier */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-2xl shadow-xl overflow-hidden border border-gray-700 hover:border-blue-500/50 transition-all duration-300 transform hover:-translate-y-2">
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold mb-2">Mission Partner</h3>
                <p className="text-gray-400 text-sm mb-4">For professionals and small teams</p>
                <div className="text-4xl font-bold mb-6">$19.99<span className="text-base text-gray-500">/month</span></div>
                <ul className="space-y-3 mb-8 text-left text-sm">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Unlimited recordings</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Branded reports</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Team sharing</span>
                  </li>
                </ul>
                <Link 
                  href="/signup?plan=mission" 
                  className="block w-full py-3 px-4 text-center rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition text-sm"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Business & Court Certification Tiers - Stacked on mobile */}
            <div className="space-y-6 md:col-span-2 lg:col-span-1">
              {/* Business Tier */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-2xl shadow-xl overflow-hidden border border-gray-700 hover:border-blue-500/50 transition-all duration-300">
                <div className="p-5 text-center">
                  <h3 className="text-lg font-bold mb-1">Business</h3>
                  <p className="text-gray-400 text-xs mb-2">For growing organizations</p>
                  <div className="text-2xl font-bold mb-4">$49<span className="text-sm text-gray-500">/month</span></div>
                  <ul className="space-y-2 mb-4 text-left text-xs">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-1">✓</span>
                      <span>Unlimited everything</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-1">✓</span>
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-1">✓</span>
                      <span>AI summaries</span>
                    </li>
                  </ul>
                  <Link 
                    href="/signup?plan=business" 
                    className="block w-full py-2 px-3 text-center rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition text-xs"
                  >
                    Contact Sales
                  </Link>
                </div>
              </div>

              {/* Court Certification Tier */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-2xl shadow-xl overflow-hidden border border-amber-500/30 hover:border-amber-400/50 transition-all duration-300">
                <div className="p-5 text-center">
                  <h3 className="text-lg font-bold mb-1">Court Certification</h3>
                  <p className="text-amber-400 text-xs mb-2">One-time certification</p>
                  <div className="text-2xl font-bold mb-4">$150<span className="text-sm text-amber-400/80"> one-time</span></div>
                  <ul className="space-y-2 mb-4 text-left text-xs">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-1">✓</span>
                      <span>Court-ready certificate</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-1">✓</span>
                      <span>Verified signature</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-1">✓</span>
                      <span>Priority legal support</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-1">✓</span>
                      <span>Dedicated account manager</span>
                    </li>
                  </ul>
                  <Link 
                    href="/contact" 
                    className="block w-full py-3 px-4 text-center rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition text-sm"
                  >
                    Contact Sales
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-16 text-center text-gray-400 text-sm">
            <p>Need a custom plan for your organization? <Link href="/contact" className="text-blue-400 hover:underline">Contact our sales team</Link></p>
          </div>
        </div>
      </section>
      
      {/* CTA SECTION */}
      <section className="py-20 px-6 bg-gradient-to-r from-purple-900 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to protect your truth?</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of users who trust ProofAI to document and protect their rights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/recorder"
              className="px-8 py-4 rounded-xl bg-white text-gray-900 font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl hover:shadow-purple-500/20 flex items-center justify-center gap-2"
            >
              🚀 Start Recording Now
            </Link>
            <Link
              href="/signup"
              className="px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
      
      {/* FOOTER */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                ProofAI
              </h2>
              <p className="text-gray-400 text-sm mt-2">Document truth. Defend dignity.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition">Privacy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition">Terms</Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition">Contact</Link>
              <Link href="/blog" className="text-gray-400 hover:text-white transition">Blog</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} ProofAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
