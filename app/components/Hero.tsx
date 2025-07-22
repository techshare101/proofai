'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRef } from 'react';

export default function Hero() {
  // Reference for the "How It Works" section (for smooth scrolling)
  const featuresRef = useRef<null | HTMLDivElement>(null);

  // Framer Motion variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8 } }
  };

  const slideUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.3 } }
  };

  // Animation variants for TypeScript compatibility
  const pulse = {
    initial: { scale: 1 },
    animate: { scale: 1.02 },
  };
  
  // Define a simple, working pulse animation
  const pulseAnimation = {
    scale: [1, 1.02, 1],
  };

  // Smooth scroll function
  const scrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-gradient-to-r from-purple-700 to-blue-600 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-32 text-center">
        <div className="md:flex md:items-center md:justify-between">
          <div className="md:flex-1">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <div className="flex flex-col items-center sm:flex-row sm:justify-center sm:items-center">
                <div className="mb-4 sm:mb-0 sm:mr-4">
                  <div className="relative w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-blue-800"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M21.07 11.07c-.88.88-1.5 1-2.05 1-.28 0-.53-.04-.79-.08-.2-.03-.4-.05-.6-.05-1.17 0-2.17.95-2.26 2.11-.06.82.46 1.34.78 1.86.26.4.41.65.41 1.09 0 .81-.66 1.47-1.47 1.47-.16 0-.29-.13-.29-.29 0-.1.05-.2.14-.25.31-.19.49-.52.49-.88 0-.22-.05-.43-.12-.64-.14-.38-.3-.83-.16-1.3.14-.46.53-.72.91-.72.31 0 .63.15.82.41.06-.4-.18-1.35-1.21-2.38-.74-.74-1.34-1.05-1.75-1.18-1.46-.48-2.92.46-2.92 1.91 0 .59.29 1.12.29 1.68 0 .33-.16.64-.41.83.04.83.51 1.52 1.16 1.83.5.24.78.74.78 1.29 0 .9-.73 1.63-1.63 1.63s-1.63-.73-1.63-1.63c0-.54.27-1.04.78-1.29.65-.31 1.12-1.01 1.16-1.83-.25-.19-.41-.5-.41-.83 0-.56.29-1.08.29-1.68 0-1.45-1.46-2.39-2.92-1.91-.41.14-1.01.44-1.75 1.18-1.42 1.42-1.42 2.74-1.03 3.5.41.81 1.28.96 1.77.69-.08-.23-.12-.47-.12-.72 0-.37.18-.69.49-.88.08-.05.14-.15.14-.25 0-.16-.13-.29-.29-.29-.82 0-1.48.67-1.48 1.48 0 .44.15.69.41 1.09.32.5.84 1.03.78 1.85-.09 1.16-1.09 2.11-2.26 2.11-1.34 0-1.93-1.19-1.57-1.81.18-.31.6-.45.98-.34.28.08.56-.08.56-.37 0-.25-.22-.45-.46-.4-.87.17-1.31.77-1.31 1.46 0 1.68 1.87 2.24 2.97 1.12 1.12-.07 1.96-.91 2.12-1.97.06-.39-.01-.71-.11-.93-.14-.34-.35-.65-.35-1.09 0-.45.21-.87.54-1.15.21-.18.47-.26.7-.26.52 0 .98.33 1.15.82.19.53.05 1.15-.06 1.57-.1.4-.15.67-.15 1.03 0 .8.65 1.46 1.46 1.46.8 0 1.46-.65 1.46-1.46 0-.35-.04-.62-.15-1.02-.11-.42-.25-1.04-.06-1.57.17-.49.63-.82 1.15-.82.24 0 .5.08.71.25.33.28.53.7.53 1.16 0 .44-.21.75-.35 1.09-.1.23-.16.54-.11.93.16 1.06 1 1.9 2.12 1.97 1.1 1.12 2.97.56 2.97-1.12 0-.69-.44-1.29-1.31-1.46-.24-.05-.46.15-.46.4 0 .29.28.46.56.37.38-.11.8.03.98.34.36.6-.23 1.81-1.57 1.81-1.17 0-2.17-.94-2.26-2.11-.06-.82.46-1.35.78-1.85.26-.4.41-.65.41-1.09 0-.81-.66-1.47-1.47-1.47-.16 0-.29.13-.29.29 0 .1.05.2.14.25.31.19.49.52.49.88 0 .25-.04.49-.12.72.49.27 1.36.12 1.77-.69.22-.45.4-1.11-.03-1.93z"/>
                    </svg>
                  </div>
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-white">
                  ProofAI
                </h1>
              </div>
              <p className="text-lg md:text-xl text-white/90 mt-4">
                Secure video evidence and instant legal proof for workers, citizens, and defenders of justice.
              </p>
            </motion.div>
            
            <motion.div 
              className="mt-8 flex flex-col sm:flex-row justify-center gap-4"
              initial="hidden"
              animate="visible"
              variants={slideUp}
            >
              <Link 
                href="/recorder"
                className="bg-white text-purple-700 font-semibold px-6 py-3 rounded-lg shadow hover:bg-gray-100 transition flex items-center justify-center"
              >
                🎥 Prove Your Truth. Protect Your Rights. Record Now.
              </Link>
              <a
                href="#features"
                className="bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-purple-800 transition flex items-center justify-center"
                onClick={scrollToFeatures}
              >
                📘 Explore Features
              </a>
            </motion.div>
          </div>
          
          <div className="hidden md:block md:flex-1 md:ml-8 mt-8 md:mt-0">
            <div className="relative w-full h-64">
              <Image
                src="/hero-illustration.svg"
                alt="Secure video evidence illustration"
                width={500}
                height={375}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile image (displayed only on smaller screens) */}
      <div className="md:hidden px-8 pb-16">
        <div className="relative w-full h-48">
          <Image
            src="/hero-illustration.svg"
            alt="Secure video evidence illustration"
            width={400}
            height={300}
            className="w-full h-full object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
