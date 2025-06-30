import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../app/contexts/AuthContext';
import { getMaxRecordingDuration, formatRecordingTime } from '../lib/recordingLimits';
import { toast } from 'react-hot-toast';

/**
 * Custom hook to handle tier-based recording duration limits
 * @param options Configuration options
 * @returns Recording state management functions and values
 */
export function useRecordGuard(options: {
  onLimitReached?: () => void;
  debugOverridePlan?: string;
}) {
  const { session } = useAuth();
  const { onLimitReached, debugOverridePlan } = options;
  
  // Get user's plan from session metadata or use debug override
  const userPlan = debugOverridePlan || session?.user?.user_metadata?.plan || 'free';
  
  // Recording time tracking state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Get max duration based on user's plan
  const maxDuration = getMaxRecordingDuration({ plan: userPlan });
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, []);
  
  // Start recording timer with plan-based limits
  const startRecordingTimer = () => {
    // Reset timers
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    
    setIsRecording(true);
    setRecordingTime(0);
    setRemainingTime(maxDuration);
    
    recordingTimer.current = setInterval(() => {
      setRecordingTime(prev => {
        const newTime = prev + 1;
        
        // Check if we've hit the time limit - use >= to ensure we catch exact matches
        if (newTime >= maxDuration) {
          // Clear timer first to prevent race conditions
          if (recordingTimer.current) {
            clearInterval(recordingTimer.current);
            recordingTimer.current = null;
          }
          
          setIsRecording(false);
          
          // Show toast notification
          toast.success(`Recording limit for your plan (${formatRecordingTime(maxDuration)}) reached. Recording stopped.`, {
            duration: 5000,
            position: 'top-center',
            icon: '⏱️'
          });
          
          console.log(`[RecordGuard] Auto-stop triggered at ${newTime}s for plan ${userPlan} (limit: ${maxDuration}s)`);
          
          // Call the callback if provided
          if (onLimitReached) {
            // Small timeout to ensure state is updated before callback
            setTimeout(() => {
              onLimitReached();
            }, 10);
          }
          
          // Return maxDuration to cap the time at the limit
          setRemainingTime(0);
          return maxDuration;
        }
        
        setRemainingTime(maxDuration - newTime);
        return newTime;
      });
    }, 1000);
  };
  
  // Stop recording timer
  const stopRecordingTimer = () => {
    setIsRecording(false);
    
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
  };
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number) => formatRecordingTime(seconds);
  
  // Create progress percentage for UI
  const progressPercentage = Math.min(100, (recordingTime / maxDuration) * 100);
  
  return {
    isRecording,
    recordingTime,
    remainingTime,
    maxDuration,
    userPlan,
    progressPercentage,
    formatTime,
    startRecordingTimer,
    stopRecordingTimer,
    isTimeWarning: remainingTime < 30, // Flag when less than 30 seconds remaining
  };
}
