'use client';

import { usePresenceStore, PARTICIPANT_COLORS } from '@/stores/presenceStore';
import type { ParticipantName } from '@/types';

interface ViewerAvatarsProps {
  orderId: string;
  excludeCurrentUser?: boolean;
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

function getInitials(name: ParticipantName): string {
  return name.charAt(0).toUpperCase();
}

export function ViewerAvatars({ 
  orderId, 
  excludeCurrentUser = false, 
  size = 'sm',
  maxDisplay = 5,
  className = '' 
}: ViewerAvatarsProps) {
  const getViewersForOrder = usePresenceStore((state) => state.getViewersForOrder);
  const currentUser = usePresenceStore((state) => state.currentUser);
  
  let viewers = getViewersForOrder(orderId);
  
  if (excludeCurrentUser && currentUser) {
    viewers = viewers.filter((v) => v.name !== currentUser);
  }

  if (viewers.length === 0) {
    return null;
  }

  const displayViewers = viewers.slice(0, maxDisplay);
  const remainingCount = viewers.length - maxDisplay;

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-1.5">
        {displayViewers.map((viewer) => {
          const color = PARTICIPANT_COLORS[viewer.name];
          return (
            <div
              key={viewer.name}
              className={`relative group ${SIZE_CLASSES[size]} rounded-full flex items-center justify-center text-white font-medium border-2 border-white shadow-sm`}
              style={{ backgroundColor: color }}
              title={viewer.name}
            >
              {getInitials(viewer.name)}
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {viewer.name} просматривает
              </div>
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div
            className={`${SIZE_CLASSES[size]} rounded-full flex items-center justify-center bg-gray-200 text-gray-600 font-medium border-2 border-white`}
            title={`Ещё ${remainingCount}`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
      {viewers.length > 0 && (
        <span className="ml-2 text-xs text-gray-500">
          {viewers.length === 1 ? 'смотрит' : 'смотрят'}
        </span>
      )}
    </div>
  );
}
