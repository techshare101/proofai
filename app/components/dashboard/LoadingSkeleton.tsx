'use client'

export default function LoadingSkeleton({ count = 3 }) {
  return (
    <>
      {Array(count).fill(0).map((_, index) => (
        <div 
          key={`skeleton-${index}`} 
          className="border rounded-lg p-4 bg-white shadow animate-pulse"
        >
          {/* Title skeleton */}
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
          
          {/* Date skeleton */}
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          
          {/* Folder skeleton */}
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      ))}
    </>
  );
}
