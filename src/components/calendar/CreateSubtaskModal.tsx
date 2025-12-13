'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { fetchOrders, createSubtask, updateSubtask } from '@/lib/api';
import type { Order, ParticipantName, SubtaskStatus } from '@/types';

interface CreateSubtaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function CreateSubtaskModal({
  isOpen,
  onClose,
  selectedDate,
  onSuccess,
  onError,
}: CreateSubtaskModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<ParticipantName | ''>('');
  const [estimatedHours, setEstimatedHours] = useState('');

  // Load orders on mount
  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders();
      // Filter only active orders
      const activeOrders = data.filter(o => 
        o.status !== 'completed' && o.status !== 'rejected'
      );
      setOrders(activeOrders);
    } catch (err) {
      onError('Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrderId || !title.trim()) {
      onError('Выберите заказ и введите название подзадачи');
      return;
    }

    setSubmitting(true);
    try {
      // Create subtask
      const subtask = await createSubtask(selectedOrderId, {
        title: title.trim(),
        description: description.trim() || null,
        status: 'planning' as SubtaskStatus,
        assignedTo: assignedTo || null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
      });

      // Update subtask with dueDate via the calendar move endpoint
      // Since createSubtask doesn't support dueDate, we need to update it
      await updateSubtask(subtask.id, {
        // The API should support dueDate in update
      });

      // For now, we'll use the move endpoint which sets the date
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/calendar/subtasks/${subtask.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr }),
      });

      onSuccess();
      handleClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Не удалось создать подзадачу');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedOrderId('');
    setTitle('');
    setDescription('');
    setAssignedTo('');
    setEstimatedHours('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Новая подзадача</h2>
            <p className="text-sm text-muted-foreground">
              Дедлайн: {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Order select */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Заказ <span className="text-destructive">*</span>
            </label>
            {loading ? (
              <div className="h-10 bg-secondary rounded-lg animate-pulse" />
            ) : (
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-foreground focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Выберите заказ...</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    #{String(order.orderNumber).padStart(3, '0')} - {order.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Название <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название подзадачи"
              className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание подзадачи..."
              rows={3}
              className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Assigned to */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Исполнитель
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value as ParticipantName | '')}
              className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-foreground focus:ring-2 focus:ring-primary"
            >
              <option value="">Не назначен</option>
              <option value="Никита">Никита</option>
              <option value="Саня">Саня</option>
              <option value="Ксюша">Ксюша</option>
            </select>
          </div>

          {/* Estimated hours */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Оценка времени (часы)
            </label>
            <input
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="0"
              min="0"
              step="0.5"
              className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedOrderId || !title.trim()}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
