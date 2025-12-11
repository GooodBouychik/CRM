'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface EnvSettingsData {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_BOT_TOKEN_SET: boolean;
  REDIS_HOST: string;
  REDIS_PORT: string;
  APP_URL: string;
}

interface ServerStatus {
  telegramConfigured: boolean;
  redisConfigured: boolean;
  port: string;
  corsOrigin: string;
}

export function EnvSettings() {
  const [settings, setSettings] = useState<EnvSettingsData | null>(null);
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    TELEGRAM_BOT_TOKEN: '',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6379',
    APP_URL: 'http://localhost:3000',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [envRes, statusRes] = await Promise.all([
        api.get<EnvSettingsData>('/settings/env'),
        api.get<ServerStatus>('/settings/status'),
      ]);
      
      setSettings(envRes);
      setStatus(statusRes);
      setFormData({
        TELEGRAM_BOT_TOKEN: envRes.TELEGRAM_BOT_TOKEN_SET ? '***configured***' : '',
        REDIS_HOST: envRes.REDIS_HOST,
        REDIS_PORT: envRes.REDIS_PORT,
        APP_URL: envRes.APP_URL,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const result = await api.put<{ success: boolean; message: string }>('/settings/env', formData);
      setMessage({ type: 'success', text: result.message });
      loadSettings();
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка сохранения настроек' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Переменные окружения
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Настройки сервера. После сохранения требуется перезапуск сервера.
        </p>
      </div>

      {/* Server Status */}
      {status && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Статус сервера
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status.telegramConfigured ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="text-gray-600 dark:text-gray-400">
                Telegram: {status.telegramConfigured ? 'Подключен' : 'Не настроен'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status.redisConfigured ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="text-gray-600 dark:text-gray-400">
                Redis: {status.redisConfigured ? 'Подключен' : 'Не настроен'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="space-y-4">
        {/* Telegram Bot Token */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Telegram Bot Token
          </label>
          <input
            type="password"
            value={formData.TELEGRAM_BOT_TOKEN}
            onChange={(e) => setFormData({ ...formData, TELEGRAM_BOT_TOKEN: e.target.value })}
            placeholder="Введите токен бота"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Получите токен у @BotFather в Telegram
          </p>
        </div>

        {/* Redis Host */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Redis Host
            </label>
            <input
              type="text"
              value={formData.REDIS_HOST}
              onChange={(e) => setFormData({ ...formData, REDIS_HOST: e.target.value })}
              placeholder="localhost"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Redis Port
            </label>
            <input
              type="text"
              value={formData.REDIS_PORT}
              onChange={(e) => setFormData({ ...formData, REDIS_PORT: e.target.value })}
              placeholder="6379"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* App URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            URL приложения
          </label>
          <input
            type="text"
            value={formData.APP_URL}
            onChange={(e) => setFormData({ ...formData, APP_URL: e.target.value })}
            placeholder="http://localhost:3000"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Используется для ссылок в уведомлениях
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </button>
      </div>
    </div>
  );
}
