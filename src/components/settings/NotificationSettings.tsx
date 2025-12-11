'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserPreferences, updateUserPreferences, type UserPreferences, type UpdatePreferencesInput } from '@/lib/api';
import type { ParticipantName } from '@/types';

interface NotificationSettingsProps {
  userName: ParticipantName;
  onClose?: () => void;
}

export function NotificationSettings({ userName, onClose }: NotificationSettingsProps) {
  const queryClient = useQueryClient();
  
  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['userPreferences', userName],
    queryFn: () => fetchUserPreferences(userName),
  });

  const [localPrefs, setLocalPrefs] = useState<UserPreferences | null>(null);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  const mutation = useMutation({
    mutationFn: (prefs: UpdatePreferencesInput) => updateUserPreferences(userName, prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences', userName] });
    },
  });

  const handleNotificationToggle = (key: keyof UserPreferences['notifications']) => {
    if (!localPrefs) return;
    
    const newNotifications = {
      ...localPrefs.notifications,
      [key]: !localPrefs.notifications[key],
    };
    
    setLocalPrefs({ ...localPrefs, notifications: newNotifications });
    mutation.mutate({ notifications: { [key]: newNotifications[key] } });
  };

  const handleQuietHoursToggle = () => {
    if (!localPrefs) return;
    
    const newQuietHours = {
      ...localPrefs.quietHours,
      enabled: !localPrefs.quietHours.enabled,
    };
    
    setLocalPrefs({ ...localPrefs, quietHours: newQuietHours });
    mutation.mutate({ quietHours: { enabled: newQuietHours.enabled } });
  };


  const handleQuietHoursTimeChange = (field: 'start' | 'end', value: string) => {
    if (!localPrefs) return;
    
    const newQuietHours = {
      ...localPrefs.quietHours,
      [field]: value,
    };
    
    setLocalPrefs({ ...localPrefs, quietHours: newQuietHours });
    mutation.mutate({ quietHours: { [field]: value } });
  };

  const handleDailyDigestToggle = () => {
    if (!localPrefs) return;
    
    const newDailyDigest = {
      ...localPrefs.dailyDigest,
      enabled: !localPrefs.dailyDigest.enabled,
    };
    
    setLocalPrefs({ ...localPrefs, dailyDigest: newDailyDigest });
    mutation.mutate({ dailyDigest: { enabled: newDailyDigest.enabled } });
  };

  const handleDailyDigestTimeChange = (value: string) => {
    if (!localPrefs) return;
    
    const newDailyDigest = {
      ...localPrefs.dailyDigest,
      time: value,
    };
    
    setLocalPrefs({ ...localPrefs, dailyDigest: newDailyDigest });
    mutation.mutate({ dailyDigest: { time: value } });
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !localPrefs) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <p className="text-red-500">Ошибка загрузки настроек</p>
      </div>
    );
  }

  const notificationLabels: Record<keyof UserPreferences['notifications'], string> = {
    newOrder: 'Новые заказы',
    comments: 'Комментарии',
    statusChanges: 'Изменения статуса',
    mentions: 'Упоминания (@имя)',
    deadlineReminders: 'Напоминания о дедлайнах',
  };


  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Настройки уведомлений
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Пользователь: <span className="font-medium text-gray-700">{userName}</span>
      </p>

      {/* Notification Types */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Типы уведомлений</h3>
        <div className="space-y-3">
          {(Object.keys(notificationLabels) as Array<keyof UserPreferences['notifications']>).map((key) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-600">{notificationLabels[key]}</span>
              <input
                type="checkbox"
                checked={localPrefs.notifications[key]}
                onChange={() => handleNotificationToggle(key)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="mb-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Тихие часы</h3>
          <input
            type="checkbox"
            checked={localPrefs.quietHours.enabled}
            onChange={handleQuietHoursToggle}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Уведомления не будут отправляться в указанное время
        </p>
        {localPrefs.quietHours.enabled && (
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={localPrefs.quietHours.start}
              onChange={(e) => handleQuietHoursTimeChange('start', e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-500">—</span>
            <input
              type="time"
              value={localPrefs.quietHours.end}
              onChange={(e) => handleQuietHoursTimeChange('end', e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>


      {/* Daily Digest */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Ежедневная сводка</h3>
          <input
            type="checkbox"
            checked={localPrefs.dailyDigest.enabled}
            onChange={handleDailyDigestToggle}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Получать сводку за день в указанное время
        </p>
        {localPrefs.dailyDigest.enabled && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Время отправки:</span>
            <input
              type="time"
              value={localPrefs.dailyDigest.time}
              onChange={(e) => handleDailyDigestTimeChange(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {mutation.isPending && (
        <div className="mt-4 text-sm text-blue-600">
          Сохранение...
        </div>
      )}

      {mutation.isError && (
        <div className="mt-4 text-sm text-red-500">
          Ошибка сохранения настроек
        </div>
      )}
    </div>
  );
}
