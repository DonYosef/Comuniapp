import React, { useState } from 'react';

interface Community {
  id: string;
  name: string;
  address: string;
}

interface CommunitiesDisplayProps {
  communities: Community[];
  maxDisplay?: number;
}

export default function CommunitiesDisplay({
  communities,
  maxDisplay = 1,
}: CommunitiesDisplayProps) {
  const [showAll, setShowAll] = useState(false);

  if (!communities || communities.length === 0) {
    return <div className="text-sm font-medium text-gray-900 dark:text-white">Sin asignar</div>;
  }

  const activeCommunities = communities.filter((community) => community.name);
  const displayCommunities = showAll ? activeCommunities : activeCommunities.slice(0, maxDisplay);
  const hasMore = activeCommunities.length > maxDisplay;

  return (
    <div className="relative group">
      <div className="text-sm text-gray-900 dark:text-white">
        {hasMore && !showAll && (
          <span
            className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
            onClick={() => setShowAll(true)}
          >
            ver más...
          </span>
        )}
        {hasMore && showAll && (
          <span
            className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
            onClick={() => setShowAll(false)}
          >
            ver menos
          </span>
        )}
        {!hasMore && activeCommunities.length > 0 && (
          <span>
            {activeCommunities.map((community, index) => (
              <span key={community.id}>
                {community.name}
                {index < activeCommunities.length - 1 && ', '}
              </span>
            ))}
          </span>
        )}
      </div>

      {/* Tooltip con todas las comunidades */}
      {hasMore && (
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-xs">
            <div className="font-medium mb-1">Comunidades activas:</div>
            <div className="space-y-1">
              {activeCommunities.map((community) => (
                <div key={community.id} className="flex flex-col">
                  <span className="font-medium">{community.name}</span>
                  <span className="text-gray-300 text-xs">{community.address}</span>
                </div>
              ))}
            </div>
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
          </div>
        </div>
      )}
    </div>
  );
}
