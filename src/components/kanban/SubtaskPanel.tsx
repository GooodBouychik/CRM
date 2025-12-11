'use client';

import { useState, useEffect } from 'react';
import type { Subtask, ParticipantName, SubtaskStatus } from '@/types';
import { updateSubtask, deleteSubtask } from '@/lib/api';

const PARTICIPANTS: ParticipantName[] = ['Никита', 'Саня', 'Ксюша'];

const STATUS_LABELS: Record<SubtaskStatus, string> = {
  planning: 'Планирование',
  development: 'Разработка',
  review: 'Проверка',
  completed: 'Завершено',
  archived: 'Архив',
};

interface SubtaskPanelProps {
  subtask: Subtask;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (subtask: Subtask) => void;
  onDelete: (subtaskId: string) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export function SubtaskPanel({
  subtask,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onError,
  onSuccess,
}: SubtaskPanelProps) {
  const [title, setTitle] = useState(subtask.title);
  const [description, setDescription] = useState(subtask.description || '');
  const [assignedTo, setAssignedTo] = useState<ParticipantName | ''>(subtask.assignedTo || '');
  const [estimatedHours, setEstimatedHours] = useState(subtask.estimatedHours?.toString() || '');
  const [status, setStatus] = useState<SubtaskStatus>(subtask.status);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reset form when subtask changes
  useEffect(() => {
    setTitle(subtask.title);
    setDescription(subtask.description || '');
    setAssignedTo(subtask.assignedTo || '');
    setEstimatedHours(subtask.estimatedHours?.toString() || '');
    setStatus(subtask.status);
  }, [subtask]);

  const handleSave = async () => {
    if (!title.trim()) {
      onError?.('Название обязательно');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateSubtask(subtask.id, {
        title: title.trim(),
        description: description.trim() || null,
        assignedTo: assignedTo || null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        status,
      });
      onUpdate(updated);
      onSuccess?.('Подзадача обновлена');
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить подзадачу?')) return;

    setDeleting(true);
    try {
      await deleteSubtask(subtask.id);
      onDelete(subtask.id);
      onClose();
      onSuccess?.('Подзадача удалена');
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 max-w-full bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Sub#{String(subtask.subtaskNumber).padStart(3, '0')}
            </span>
            {subtask.isPinned && (
              <span className="text-yellow-500" title="Закреплено">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                </svg>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Название
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900"
              placeholder="Название подзадачи"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 resize-none"
              placeholder="Описание подзадачи..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Статус
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SubtaskStatus)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Исполнитель
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value as ParticipantName | '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900"
            >
              <option value="">Не назначен</option>
              {PARTICIPANTS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Time estimate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Оценка времени (часы)
            </label>
            <input
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900"
              placeholder="0"
            />
          </div>

          {/* Comments section placeholder */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Комментарии
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              Комментарии будут доступны в Phase 5
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>Создано: {new Date(subtask.createdAt).toLocaleString('ru-RU')}</p>
            <p>Обновлено: {new Date(subtask.updatedAt).toLocaleString('ru-RU')}</p>
          </div>
        </div>

        {/* Footer with actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
          >
            {deleting ? 'Удаление...' : 'Удалить'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
