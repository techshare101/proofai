'use client';

import supabase from '../lib/supabaseClient';

export default function AuthError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <p className="text-red-700 text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              await supabase.auth.signOut();
            }
            window.location.reload();
          }}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Retry Login
        </button>
      </div>
    </div>
  )
}
