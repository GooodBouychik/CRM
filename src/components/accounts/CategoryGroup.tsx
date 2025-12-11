'use client';

import { useState } from 'react';
import type { ServiceAccount, AccountCategory } from '@/types';
import { AccountCard } from './AccountCard';

export interface CategoryGroupProps {
  category: AccountCategory | null;
  accounts: ServiceAccount[];
  defaultExpanded?: boolean;
  onEditAccount?: (account: ServiceAccount) => void;
  onDeleteAccount?: (account: ServiceAccount) => void;
}

export function CategoryGroup({
  category,
  accounts,
  defaultExpanded = true,
  onEditAccount,
  onDeleteAccount,
}: CategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const categoryName = category?.name || 'Без категории';
  const categoryIcon = category?.icon || '📁';
  const categoryColor = category?.color || '#6b7280';

  return (
    <div className="mb-6">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {/* Expand/Collapse Icon */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        {/* Category Icon */}
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ backgroundColor: `${categoryColor}20` }}
        >
          {categoryIcon}
        </span>

        {/* Category Name */}
        <span className="font-medium text-gray-900 dark:text-gray-100 flex-1 text-left">
          {categoryName}
        </span>

        {/* Account Count Badge */}
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${categoryColor}20`,
            color: categoryColor,
          }}
        >
          {accounts.length}
        </span>
      </button>

      {/* Accounts List */}
      {isExpanded && accounts.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pl-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={onEditAccount ? () => onEditAccount(account) : undefined}
              onDelete={onDeleteAccount ? () => onDeleteAccount(account) : undefined}
            />
          ))}
        </div>
      )}

      {/* Empty state for category */}
      {isExpanded && accounts.length === 0 && (
        <div className="mt-3 pl-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Нет аккаунтов в этой категории
        </div>
      )}
    </div>
  );
}

export default CategoryGroup;
