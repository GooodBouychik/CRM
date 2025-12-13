'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { CustomFieldsManager } from '@/components/customFields';
import { EnvSettings } from '@/components/settings';

type SettingsTab = 'custom-fields' | 'env';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('custom-fields');

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'custom-fields', label: 'Кастомные поля', icon: '📝' },
    { id: 'env', label: 'Сервер', icon: '⚙️' },
  ];

  return (
    <AppLayout
      title="Настройки"
      subtitle="Управление системой"
    >
      <div className="flex flex-col md:flex-row h-full">
        {/* Sidebar tabs */}
        <div className="w-full md:w-56 lg:w-64 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 md:p-4">
          <nav className="flex md:flex-col gap-1.5 md:gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-left transition-colors touch-manipulation flex-1 md:flex-none ${
                  activeTab === tab.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-sm md:text-base">{tab.icon}</span>
                <span className="font-medium text-sm md:text-base">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content area */}
        <div className="flex-1 p-3 md:p-6 overflow-auto">
          {activeTab === 'custom-fields' && (
            <CustomFieldsManager />
          )}
          {activeTab === 'env' && (
            <EnvSettings />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
