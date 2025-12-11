'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Comment, ParticipantName } from '@/types';
import type { OrderHistoryEntry } from '@/lib/api';
import type { ArchivedOrder } from './ArchiveOrderCard';

// Avatar colors for participants
const avatarColors: Record<ParticipantName, string> = {
  'Никита': 'bg-blue-500',
  'Саня': 'bg-green-500',
  'Ксюша': 'bg-purple-500',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Завершён',
  rejected: 'Отклонён',
  new: 'Новый',
  in_progress: 'В работе',
  review: 'На проверке',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

const FIELD_LABELS: Record<string, string> = {
  title: 'Название',
  description: 'Описание',
  clientName: 'Клиент',
  amount: 'Сумма',
  status: 'Статус',
  priority: 'Приоритет',
  dueDate: 'Дедлайн',
  tags: 'Теги',
  assignedTo: 'Исполнители',
  isFavorite: 'Избранное',
};

type TabType = 'details' | 'comments' | 'history';

export interface ArchiveDetailProps {
  order: ArchivedOrder;
  comments: Comment[];
  history: OrderHistoryEntry[];
  isLoading?: boolean;
  onClose: () => void;
}

export function ArchiveDetail({
  order,
  comments,
  history,
  isLoading = false,
  onClose,
}: ArchiveDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const isRejected = order.status === 'rejected';

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Calculate participant contributions
  const participantContributions = comments.reduce((acc, comment) => {
    if (!comment.isSystem) {
      acc[comment.author] = (acc[comment.author] || 0) + 1;
    }
    return acc;
  }, {} as Record<ParticipantName, number>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${
          isRejected ? 'bg-red-50 dark:bg-red-900/10' : 'bg-green-50 dark:bg-green-900/10'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                  #{String(order.orderNumber).padStart(3, '0')}
                </span>
                <span
                  className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                    isRejected
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  }`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {order.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Закрыть"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {[
            { id: 'details' as TabType, label: 'Детали', icon: '📋' },
            { id: 'comments' as TabType, label: `Комментарии (${comments.length})`, icon: '💬' },
            { id: 'history' as TabType, label: `История (${history.length})`, icon: '📜' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'details' && (
                <DetailsTab order={order} participantContributions={participantContributions} />
              )}
              {activeTab === 'comments' && <CommentsTab comments={comments} />}
              {activeTab === 'history' && <HistoryTab history={history} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Details Tab Component
function DetailsTab({
  order,
  participantContributions,
}: {
  order: ArchivedOrder;
  participantContributions: Record<ParticipantName, number>;
}) {
  return (
    <div className="space-y-6">
      {/* Order info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard label="Клиент" value={order.clientName || '—'} />
        <InfoCard
          label="Сумма"
          value={order.amount ? `${order.amount.toLocaleString('ru-RU')} ₽` : '—'}
        />
        <InfoCard label="Приоритет" value={PRIORITY_LABELS[order.priority]} />
        <InfoCard
          label="Дедлайн"
          value={order.dueDate ? format(new Date(order.dueDate), 'd MMMM yyyy', { locale: ru }) : '—'}
        />
        <InfoCard
          label="Завершён"
          value={format(new Date(order.completedAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
        />
        <InfoCard
          label="Создан"
          value={format(new Date(order.createdAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
        />
      </div>

      {/* Description */}
      {order.description && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Описание</h4>
          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            {order.description}
          </p>
        </div>
      )}

      {/* Tags */}
      {order.tags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Теги</h4>
          <div className="flex flex-wrap gap-2">
            {order.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Participant contributions */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          Участники и вклад
        </h4>
        <div className="space-y-3">
          {order.participants.map((participant) => (
            <div
              key={participant}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                    avatarColors[participant] || 'bg-gray-500'
                  }`}
                >
                  {participant.charAt(0)}
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{participant}</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {participantContributions[participant] || 0} комментари
                {(participantContributions[participant] || 0) === 1
                  ? 'й'
                  : (participantContributions[participant] || 0) < 5
                  ? 'я'
                  : 'ев'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</dt>
      <dd className="text-base text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
  );
}


// Comments Tab Component
function CommentsTab({ comments }: { comments: Comment[] }) {
  // Separate root comments and replies
  const rootComments = comments.filter((c) => !c.parentId);
  const repliesMap = comments.reduce((acc, comment) => {
    if (comment.parentId) {
      if (!acc[comment.parentId]) acc[comment.parentId] = [];
      acc[comment.parentId].push(comment);
    }
    return acc;
  }, {} as Record<string, Comment[]>);

  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <svg
          className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p>Нет комментариев</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rootComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          replies={repliesMap[comment.id] || []}
        />
      ))}
    </div>
  );
}

function CommentItem({ comment, replies }: { comment: Comment; replies: Comment[] }) {
  const isSystem = comment.isSystem;

  return (
    <div className={`${isSystem ? 'opacity-70' : ''}`}>
      <div
        className={`p-4 rounded-lg ${
          isSystem
            ? 'bg-gray-100 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700'
            : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${
              isSystem ? 'bg-gray-400' : avatarColors[comment.author] || 'bg-gray-500'
            }`}
          >
            {isSystem ? '🤖' : comment.author.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {isSystem ? 'Система' : comment.author}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(comment.createdAt), 'd MMM yyyy, HH:mm', { locale: ru })}
              </span>
              {comment.editedAt && (
                <span className="text-xs text-gray-400 dark:text-gray-500">(изменено)</span>
              )}
            </div>

            {/* Content */}
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
              {comment.content}
            </p>

            {/* Reactions */}
            {comment.reactions && Object.keys(comment.reactions).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(comment.reactions).map(([emoji, users]) => (
                  <span
                    key={emoji}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                    title={users.join(', ')}
                  >
                    {emoji} {users.length}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
          {replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} replies={[]} />
          ))}
        </div>
      )}
    </div>
  );
}

// History Tab Component
function HistoryTab({ history }: { history: OrderHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <svg
          className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p>История изменений пуста</p>
      </div>
    );
  }

  // Group by date
  const groupedHistory = history.reduce((acc, entry) => {
    const date = format(new Date(entry.changedAt), 'd MMMM yyyy', { locale: ru });
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, OrderHistoryEntry[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedHistory).map(([date, entries]) => (
        <div key={date}>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 sticky top-0 bg-white dark:bg-gray-800 py-1">
            {date}
          </h4>
          <div className="relative pl-6 space-y-4">
            {/* Timeline line */}
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

            {entries.map((entry) => (
              <div key={entry.id} className="relative">
                {/* Timeline dot */}
                <div
                  className={`absolute -left-4 w-3 h-3 rounded-full ${
                    avatarColors[entry.changedBy as ParticipantName] || 'bg-gray-400'
                  } ring-2 ring-white dark:ring-gray-800`}
                ></div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {entry.changedBy}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(entry.changedAt), 'HH:mm', { locale: ru })}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Изменил(а){' '}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {FIELD_LABELS[entry.fieldName] || entry.fieldName}
                    </span>
                  </p>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded line-through">
                      {formatHistoryValue(entry.fieldName, entry.oldValue)}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                      {formatHistoryValue(entry.fieldName, entry.newValue)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatHistoryValue(fieldName: string, value: string | null): string {
  if (value === null || value === '') return '(пусто)';

  if (fieldName === 'status' && STATUS_LABELS[value]) return STATUS_LABELS[value];
  if (fieldName === 'priority' && PRIORITY_LABELS[value]) return PRIORITY_LABELS[value];
  if (value === 'true') return 'Да';
  if (value === 'false') return 'Нет';

  if (value.startsWith('[')) {
    try {
      const arr = JSON.parse(value);
      if (Array.isArray(arr)) return arr.length > 0 ? arr.join(', ') : '(пусто)';
    } catch {
      // Not valid JSON
    }
  }

  if (fieldName === 'amount' && !isNaN(Number(value))) {
    return `${Number(value).toLocaleString('ru-RU')} ₽`;
  }

  if (value.length > 50) return value.substring(0, 50) + '...';
  return value;
}

export default ArchiveDetail;
