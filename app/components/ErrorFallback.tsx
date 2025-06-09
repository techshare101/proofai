'use client';

export default function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h2>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700 text-sm font-medium">{error.message}</p>
        </div>
      </div>
    </div>
  );
}
