'use client';

import CleanseReports from '../../components/CleanseReports';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function CleanDashboard() {
  const { session } = useAuth();
  const router = useRouter();

  // Optional: Basic auth check to prevent unauthorized access
  useEffect(() => {
    if (!session) {
      router.push('/signin');
    }
  }, [session, router]);

  if (!session) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Dashboard Cleanup Tools</h1>
        <p className="text-gray-600 mb-4">
          Use these tools to clean up your Supabase storage and remove legacy PDF files.
        </p>
        <div className="flex gap-3">
          <Link 
            href="/dashboard" 
            className="text-blue-600 hover:underline"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        <CleanseReports />
        
        <div className="bg-white border border-gray-300 rounded p-4 space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-gray-700">Dashboard Information</h3>
          <p className="text-sm text-gray-600">
            Your dashboard is configured to only show valid PDF reports that match these criteria:
          </p>
          <ul className="list-disc pl-6 text-sm text-gray-600">
            <li>Have a <code>.pdf</code> extension</li>
            <li>Are at least 5KB in size</li>
            <li>Are from the new <code>reports</code> bucket (not legacy locations)</li>
            <li>Were created within the last 90 days</li>
            <li>Have valid case ID naming patterns</li>
          </ul>
          <p className="text-sm text-gray-600 mt-2">
            After using the cleanup tools above, your dashboard will only show properly formatted, 
            valid PDF reports from the current storage location.
          </p>
        </div>
      </div>
    </div>
  );
}
