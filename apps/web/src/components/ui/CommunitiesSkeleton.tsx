import React from 'react';

export default function CommunitiesSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
      </div>

      {/* Communities grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
