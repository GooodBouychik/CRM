'use client';

import { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

// Default icons for common empty states
const defaultIcons = {
  orders: (
    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  tasks: (
    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  search: (
    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  archive: (
    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  accounts: (
    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  clients: (
    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  notes: (
    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  calendar: (
    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  statistics: (
    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  customFields: (
    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  history: (
    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {/* Icon */}
      <div className="mb-4">
        {icon || defaultIcons.orders}
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Pre-configured empty states for common use cases
export function EmptyOrdersState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.orders}
      title="Нет заказов"
      description="Создайте первый заказ, чтобы начать работу"
      action={onAction ? { label: '+ Создать заказ', onClick: onAction } : undefined}
    />
  );
}

export function EmptyTasksState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.tasks}
      title="Нет задач"
      description="Добавьте задачу, чтобы отслеживать прогресс"
      action={onAction ? { label: '+ Добавить задачу', onClick: onAction } : undefined}
    />
  );
}

export function EmptySearchState() {
  return (
    <EmptyState
      icon={defaultIcons.search}
      title="Ничего не найдено"
      description="Попробуйте изменить параметры поиска"
    />
  );
}

export function EmptyArchiveState() {
  return (
    <EmptyState
      icon={defaultIcons.archive}
      title="Архив пуст"
      description="Завершённые и отклонённые заказы появятся здесь"
    />
  );
}

export function EmptyAccountsState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.accounts}
      title="Нет сохранённых аккаунтов"
      description="Добавьте учётные данные сервисов для быстрого доступа"
      action={onAction ? { label: '+ Добавить аккаунт', onClick: onAction } : undefined}
    />
  );
}

export function EmptyClientsState() {
  return (
    <EmptyState
      icon={defaultIcons.clients}
      title="Нет клиентов"
      description="Клиенты появятся после создания заказов"
    />
  );
}

export function EmptyClientNotesState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.notes}
      title="Нет заметок о клиенте"
      description="Добавьте заметку о предпочтениях или особенностях клиента"
      action={onAction ? { label: '+ Добавить заметку', onClick: onAction } : undefined}
    />
  );
}

export function EmptyClientOrdersState() {
  return (
    <EmptyState
      icon={defaultIcons.orders}
      title="Нет заказов"
      description="У этого клиента пока нет заказов"
    />
  );
}

export function EmptyHistoryState() {
  return (
    <EmptyState
      icon={defaultIcons.history}
      title="Нет заказов"
      description="Заказы появятся здесь после создания"
    />
  );
}

export function EmptyCalendarState() {
  return (
    <EmptyState
      icon={defaultIcons.calendar}
      title="Нет подзадач с дедлайнами"
      description="Добавьте дедлайны к подзадачам, чтобы они появились в календаре"
    />
  );
}

export function EmptyStatisticsState() {
  return (
    <EmptyState
      icon={defaultIcons.statistics}
      title="Нет данных за выбранный период"
      description="Попробуйте выбрать другой период или создайте заказы"
    />
  );
}

export function EmptyCustomFieldsState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.customFields}
      title="Нет кастомных полей"
      description="Создайте поля для отслеживания дополнительной информации о заказах"
      action={onAction ? { label: '+ Создать поле', onClick: onAction } : undefined}
    />
  );
}

export default EmptyState;
