'use client';

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Order, ParticipantName } from '@/types';

// Avatar colors for participants
const avatarColors: Record<ParticipantName, string> = {
  'Никита': 'bg-blue-500',
  'Саня': 'bg-green-500',
  'Ксюша': 'bg-purple-500',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Завершён',
  rejected: 'Отклонён',
};

export interface ArchivedOrder extends Order {
  completedAt: Date;
  totalComments: number;
  participants: ParticipantName[];
}

export interface ArchiveOrderCardProps {
  order: ArchivedOrder;
  onClick?: () => void;
}

export function ArchiveOrderCard({ order, onClick }: ArchiveOrderCardProps) {
  const completedDate = new Date(order.completedAt);
  const isRejected = order.status === 'rejected';

  return (
    <div
      onClick={onClick}
      className={`group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 ${
        isRejected ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-green-400'
      }`}
    >
      {/* Header with order number and status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
            #{String(order.orderNumber).padStart(3, '0')}
          </span>
          <span
            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
              isRejected
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            }`}
          >
            {STATUS_LABELS[order.status]}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {format(completedDate, 'd MMM yyyy', { locale: ru })}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
        {order.title}
      </h3>

      {/* Client name if exists */}
      {order.clientName && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span className="text-gray-400 dark:text-gray-500">Клиент:</span> {order.clientName}
        </p>
      )}

      {/* Footer with participants and comment count */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        {/* Participant avatars */}
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {order.participants.slice(0, 3).map((participant, index) => (
              <div
                key={participant}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800 ${
                  avatarColors[participant] || 'bg-gray-500'
                }`}
                title={participant}
                style={{ zIndex: 3 - index }}
              >
                {participant.charAt(0)}
              </div>
            ))}
            {order.participants.length > 3 && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-800"
                style={{ zIndex: 0 }}
              >
                +{order.participants.length - 3}
              </div>
            )}
          </div>
          {order.participants.length > 0 && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              {order.participants.length} участник{order.participants.length === 1 ? '' : order.participants.length < 5 ? 'а' : 'ов'}
            </span>
          )}
        </div>

        {/* Comment count */}
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="text-sm">{order.totalComments}</span>
        </div>
      </div>
    </div>
  );
}

export default ArchiveOrderCard;
