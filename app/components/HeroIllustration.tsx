import React, { useEffect, useRef } from 'react';

const HeroIllustration = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Cleanup
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <div className="relative w-full h-full max-w-4xl mx-auto">
      {/* Abstract 3D Background */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-indigo-900/50 to-blue-900/80 mix-blend-multiply"></div>
      </div>
      
      {/* Main 3D Phone Mockup */}
      <div className="relative z-10 flex items-center justify-center h-full min-h-[600px] md:min-h-[700px]">
        <div className="relative w-64 h-[500px] md:w-80 md:h-[600px]">
          {/* Phone frame */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 rounded-[3rem] p-2 shadow-2xl border-4 border-gray-800 overflow-hidden transform rotate-[-5deg] hover:rotate-0 transition-transform duration-500">
            {/* Screen content */}
            <div className="w-full h-full bg-gradient-to-br from-purple-900 to-blue-900 rounded-3xl p-4 relative overflow-hidden">
              {/* App UI elements */}
              <div className="relative z-10 h-full flex flex-col">
                {/* Status bar */}
                <div className="flex justify-between items-center text-white/80 text-xs mb-4 px-2">
                  <span>9:41</span>
                  <div className="flex space-x-1">
                    <span>📶</span>
                    <span>🔋</span>
                  </div>
                </div>
                
                {/* App content */}
                <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-4 flex flex-col">
                  <div className="bg-white/20 h-6 w-24 rounded-full mb-4 animate-pulse"></div>
                  <div className="bg-white/20 h-4 w-32 rounded-full mb-6"></div>
                  
                  {/* Animated recording button */}
                  <div className="mx-auto mt-8 w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg border-4 border-white/20 relative group">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping"></div>
                    <div className="w-5 h-5 bg-white rounded-full z-10"></div>
                  </div>
                  
                  <div className="mt-8 space-y-2">
                    <div className="bg-white/20 h-3 w-full rounded-full animate-pulse"></div>
                    <div className="bg-white/20 h-3 w-3/4 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
            </div>
          </div>
          
          {/* Floating UI elements */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-yellow-400/30 rounded-full mix-blend-screen filter blur-xl animate-float"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-400/30 rounded-full mix-blend-screen filter blur-xl animate-float animation-delay-2000"></div>
          <div className="absolute top-1/4 -right-16 w-16 h-16 bg-cyan-400/30 rounded-full mix-blend-screen filter blur-xl animate-float animation-delay-3000"></div>
        </div>
      </div>
      
      {/* Abstract geometric shapes */}
      <div className="absolute -z-10 w-full h-full overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      <style jsx global>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0) rotate(0deg); 
          }
          50% { 
            transform: translateY(-20px) rotate(5deg); 
          }
        }
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.7; 
          }
          50% { 
            opacity: 1; 
          }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
      `}</style>
    </div>
  );
};

export default HeroIllustration;
