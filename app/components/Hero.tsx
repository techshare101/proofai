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
              <h1 className="text-5xl md:text-6xl font-extrabold text-white">
                🔐 ProofAI
              </h1>
              <p className="text-lg md:text-xl text-white/90 mt-4">
                🧾 Document truth. Defend dignity. Create instant legal proof with video.
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
                🎥 Start Recording
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
            <motion.div 
              className="relative w-full h-64"
              animate={pulseAnimation}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Image
                src="/hero-illustration.svg"
                alt="ProofAI Documentation Illustration"
                fill
                className="object-contain"
                priority
                onError={(e) => {
                  // Fallback for when image doesn't exist
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmOGY5ZmEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzZiN2VkNiI+UHJvdmlkZWQgaWxsdXN0cmF0aW9uPC90ZXh0Pjwvc3ZnPg==';
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Mobile image (displayed only on smaller screens) */}
      <div className="md:hidden px-8 pb-16">
        <motion.div 
          className="relative w-full h-48"
          animate={pulseAnimation}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Image
            src="/hero-illustration.svg"
            alt="ProofAI Documentation Illustration"
            fill
            className="object-contain"
            priority
            onError={(e) => {
              // Fallback for when image doesn't exist
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmOGY5ZmEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzZiN2VkNiI+UHJvdmlkZWQgaWxsdXN0cmF0aW9uPC90ZXh0Pjwvc3ZnPg==';
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
