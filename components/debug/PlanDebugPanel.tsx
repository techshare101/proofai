'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserPlan } from '@/hooks/useUserPlan';
import { PLANS } from '@/lib/stripe/config';
import { useToast } from '@/components/ui/use-toast';
import { planLimits, getPlanDisplayName, formatDuration } from '@/lib/stripe/plansConfig';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Only show in development or when explicitly enabled
export default function PlanDebugPanel() {
  const [user, setUser] = useState<any>(null);
  const { plan, refreshPlan } = useUserPlan();
  const [useDebugPlans, setUseDebugPlans] = useState(false);
  const [debugPlan, setDebugPlan] = useState('self_defender');
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Get user session
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    
    getUser();
    
    // Load debug preference from localStorage
    const savedDebugPreference = localStorage.getItem('useDebugPlans');
    if (savedDebugPreference !== null) {
      setUseDebugPlans(savedDebugPreference === 'true');
    }
  }, []);

  const handleDebugToggle = (checked: boolean) => {
    setUseDebugPlans(checked);
    localStorage.setItem('useDebugPlans', String(checked));
    
    // Refresh plan data when toggling debug mode
    refreshPlan();
    
    toast({
      title: checked ? 'Debug mode enabled' : 'Using live plan data',
      description: `Now using ${checked ? 'debug' : 'live'} plan data`,
    });
  };

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDebugPlan(e.target.value);
    // In a real app, you might want to update the debug plan in your state management
    // For now, we'll just store it in localStorage
    localStorage.setItem('debugPlan', e.target.value);
    
    toast({
      title: 'Debug plan updated',
      description: `Now using ${e.target.value} plan in debug mode`,
    });
  };

  // Don't show in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SHOW_DEBUG_PANEL) {
    return null;
  }

  // Get all available plans including unlimited
  const availablePlans = Object.entries(planLimits).map(([key, seconds]) => ({
    key,
    name: getPlanDisplayName(key),
    duration: formatDuration(seconds),
    isUnlimited: key === 'unlimited',
  }));

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg border border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">RecordGuard Debug</CardTitle>
          <div className="flex items-center space-x-2">
            <Label htmlFor="debug-mode" className="text-xs">
              {useDebugPlans ? 'Debug Mode' : 'Live Mode'}
            </Label>
            <Switch
              id="debug-mode"
              checked={useDebugPlans}
              onCheckedChange={handleDebugToggle}
              className={`data-[state=checked]:bg-primary ${useDebugPlans ? 'bg-primary' : 'bg-gray-300'}`}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground mb-2">
            <p>Current Plan: <span className="font-medium">{getPlanDisplayName(debugPlan)}</span></p>
          </div>
          
          {useDebugPlans ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {availablePlans.map((plan) => (
                  <button
                    key={plan.key}
                    onClick={() => {
                      setDebugPlan(plan.key);
                      localStorage.setItem('debugPlan', plan.key);
                      toast({
                        title: 'Debug plan updated',
                        description: `Now using ${plan.name} plan in debug mode`,
                      });
                    }}
                    className={`w-full px-3 py-2 rounded-md text-left text-sm transition-colors ${
                      debugPlan === plan.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{plan.name}</span>
                      {!plan.isUnlimited && (
                        <span className="text-xs opacity-80">
                          {plan.duration}
                        </span>
                      )}
                      {plan.isUnlimited && (
                        <span className="text-xs opacity-80">
                          No Limit 🚀
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t border-gray-200 dark:border-gray-700">
                <p>Debug mode active. Changes won&apos;t affect your real plan.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium">
                Plan: <span className="text-primary">{plan?.plan || 'starter'}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Using live plan data from Stripe.</p>
              </div>
            </div>
          )}
          
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center text-xs">
              <span>Minutes Used:</span>
              <span>
                {plan?.whisper_minutes_used || 0} / {plan?.whisper_minutes_limit || 0}
              </span>
            </div>
            <div className="mt-1 w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: plan?.whisper_minutes_limit 
                    ? `${Math.min(100, (plan.whisper_minutes_used / plan.whisper_minutes_limit) * 100)}%` 
                    : '0%'
                }}
              />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {plan?.billing_period_end && (
                <p>Resets on {new Date(plan.billing_period_end).toLocaleDateString()}</p>
              )}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            onClick={refreshPlan}
          >
            Refresh Plan Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
