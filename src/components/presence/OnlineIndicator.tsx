'use client';

import { usePresenceStore, PARTICIPANT_COLORS, type Presence } from '@/stores/presenceStore';
import type { ParticipantName } from '@/types';

interface OnlineIndicatorProps {
  showOffline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

const DOT_SIZE_CLASSES = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

function getInitials(name: ParticipantName): string {
  return name.charAt(0).toUpperCase();
}

interface AvatarProps {
  presence: Presence;
  size: 'sm' | 'md' | 'lg';
}

function Avatar({ presence, size }: AvatarProps) {
  const color = PARTICIPANT_COLORS[presence.name];
  
  return (
    <div className="relative group" title={presence.name}>
      <div
        className={`${SIZE_CLASSES[size]} rounded-full flex items-center justify-center text-white font-medium`}
        style={{ backgroundColor: color }}
      >
        {getInitials(presence.name)}
      </div>
      {/* Online/Offline indicator dot */}
      <span
        className={`absolute bottom-0 right-0 ${DOT_SIZE_CLASSES[size]} rounded-full border-2 border-white ${
          presence.isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
        {presence.name} - {presence.isOnline ? 'В сети' : 'Не в сети'}
      </div>
    </div>
  );
}

export function OnlineIndicator({ showOffline = true, size = 'md', className = '' }: OnlineIndicatorProps) {
  const presence = usePresenceStore((state) => state.presence);
  const participants = Object.values(presence);
  
  const displayParticipants = showOffline 
    ? participants 
    : participants.filter((p) => p.isOnline);

  const onlineCount = participants.filter((p) => p.isOnline).length;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex -space-x-2">
        {displayParticipants.map((p) => (
          <Avatar key={p.name} presence={p} size={size} />
        ))}
      </div>
      <span className="text-sm text-gray-500">
        {onlineCount} в сети
      </span>
    </div>
  );
}
