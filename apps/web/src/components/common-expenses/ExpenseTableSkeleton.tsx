'use client';

export default function ExpenseTableSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header Skeleton */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg mr-3 animate-pulse">
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-500 rounded"></div>
            </div>
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-40 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="h-8 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse ml-auto"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Button Skeleton */}
        <div className="flex justify-end pt-4 px-6 border-t border-gray-200 dark:border-gray-700">
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
