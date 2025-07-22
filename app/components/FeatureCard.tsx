import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, color, index }) => {
  const colorVariants = {
    purple: {
      bg: 'from-purple-600/10 via-purple-900/20 to-indigo-900/20',
      border: 'border-purple-500/20',
      iconBg: 'from-purple-500 to-indigo-600',
      glow: 'rgba(168, 85, 247, 0.15)'
    },
    blue: {
      bg: 'from-blue-600/10 via-blue-900/20 to-cyan-900/20',
      border: 'border-blue-500/20',
      iconBg: 'from-blue-500 to-cyan-600',
      glow: 'rgba(59, 130, 246, 0.15)'
    },
    pink: {
      bg: 'from-pink-600/10 via-pink-900/20 to-rose-900/20',
      border: 'border-pink-500/20',
      iconBg: 'from-pink-500 to-rose-600',
      glow: 'rgba(236, 72, 153, 0.15)'
    },
    teal: {
      bg: 'from-teal-600/10 via-teal-900/20 to-emerald-900/20',
      border: 'border-teal-500/20',
      iconBg: 'from-teal-500 to-emerald-600',
      glow: 'rgba(20, 184, 166, 0.15)'
    },
    indigo: {
      bg: 'from-indigo-600/10 via-indigo-900/20 to-violet-900/20',
      border: 'border-indigo-500/20',
      iconBg: 'from-indigo-500 to-violet-600',
      glow: 'rgba(99, 102, 241, 0.15)'
    },
    amber: {
      bg: 'from-amber-600/10 via-amber-900/20 to-yellow-900/20',
      border: 'border-amber-500/20',
      iconBg: 'from-amber-500 to-yellow-600',
      glow: 'rgba(245, 158, 11, 0.15)'
    }
  };

  const colors = colorVariants[color as keyof typeof colorVariants] || colorVariants.purple;

  return (
    <div 
      className={`relative p-6 rounded-3xl bg-gradient-to-br ${colors.bg} border ${colors.border} backdrop-blur-sm overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-[${colors.glow}] hover:border-opacity-40`}
      style={{
        animation: `fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s forwards`,
        opacity: 0,
        transform: 'translateY(20px)',
        willChange: 'transform, opacity'
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-xl group-hover:scale-150 transition-transform duration-700"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-gradient-to-tr from-white/5 to-transparent blur-xl group-hover:scale-150 transition-transform duration-1000"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)'
        }}></div>
      </div>
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Icon container with gradient background */}
        <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br ${colors.iconBg} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <span className="text-2xl text-white">{icon}</span>
        </div>
        
        <h3 className="text-xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
          {title}
        </h3>
        
        <p className="text-white/80 text-sm leading-relaxed mb-4">
          {description}
        </p>
        
        {/* Animated arrow */}
        <div className="mt-auto pt-4">
          <div className="w-8 h-0.5 bg-white/40 relative group-hover:bg-white/80 transition-colors duration-300">
            <div className="absolute right-0 top-1/2 w-2 h-2 -mt-1 border-r-2 border-t-2 border-white/40 group-hover:border-white/80 transform rotate-45 origin-center transition-all duration-300"></div>
          </div>
        </div>
      </div>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <style jsx global>{`
        @keyframes fadeIn {
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default FeatureCard;
