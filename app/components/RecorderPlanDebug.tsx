'use client';

import React, { useState } from 'react';
import { formatRecordingTime } from '../../lib/recordingLimits';
import { planLimits, getPlanDisplayName } from '../lib/stripe/plansConfig';

interface RecorderPlanDebugProps {
  onPlanChange: (plan: string) => void;
  currentPlan: string;
}

/**
 * Debug component for testing different subscription plans with the recorder
 */
export default function RecorderPlanDebug({ onPlanChange, currentPlan }: RecorderPlanDebugProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Generate plan options from planLimits
  const planOptions = Object.entries(planLimits).map(([planKey, seconds]) => ({
    plan: planKey,
    name: getPlanDisplayName(planKey),
    seconds,
    formatted: formatRecordingTime(seconds),
    isUnlimited: planKey === 'unlimited'
  }));

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700"
        title="RecordGuard Debug Panel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
        </svg>
      </button>
      
      {/* Debug Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-64 p-4 bg-white rounded-lg shadow-xl border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm text-gray-700">RecordGuard Debug</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
          </div>
          
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Current Plan: <span className="font-semibold">{currentPlan}</span></p>
            <p className="text-xs text-gray-500">Duration: <span className="font-semibold">{formatRecordingTime(planLimits[currentPlan] || planLimits.free)}</span></p>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Test Different Plans:</p>
            
            {planOptions.map(({ plan, formatted }) => (
              <button
                key={plan}
                onClick={() => onPlanChange(plan)}
                className={`w-full py-1.5 px-3 text-xs rounded transition ${
                  currentPlan === plan 
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {plan.charAt(0).toUpperCase() + plan.slice(1)} ({formatted})
              </button>
            ))}
            
            <div className="mt-3 pt-2 border-t border-gray-100">
              <p className="text-[10px] text-gray-400">
                This is a debug panel for testing recording limits.
                Plan changes here are temporary and for testing only.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
