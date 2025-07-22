// app/components/PricingCTA.tsx
'use client';

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface PricingCTAProps {
  priceId: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
}

export function PricingCTA({ 
  priceId, 
  className = "",
  variant = "default",
  size = "default",
  children = "Get Started"
}: PricingCTAProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsSignedIn(!!session);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsSignedIn(!!session);
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase.auth]);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!isSignedIn) {
        // Not signed in? Redirect to sign-up with a return URL
        const returnUrl = encodeURIComponent(`/pricing?priceId=${priceId}`);
        router.push(`/sign-up?redirect_url=${returnUrl}`);
        return;
      }

      // Signed in? Proceed to checkout
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to create checkout session');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Button 
        onClick={handleClick} 
        className={`w-full ${className}`}
        variant={variant}
        size={size}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          children
        )}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-500 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
