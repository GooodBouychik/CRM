'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import type { Priority } from '@/types';
import { createOrder, getUniqueClients } from '@/lib/api';
import { useOrderStore } from '@/stores/orderStore';
import { useToast } from '@/components/ui/Toast';

interface OrderFormData {
  title: string;
  clientName: string;
  amount: string;
  dueDate: string;
  priority: Priority;
  tags: string;
}

interface OrderFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; icon: string }[] = [
  { value: 'high', label: 'Высокий', icon: '🔴' },
  { value: 'medium', label: 'Средний', icon: '🟡' },
  { value: 'low', label: 'Низкий', icon: '⚪' },
];

export function OrderForm({ onClose, onSuccess }: OrderFormProps) {
  const { addOrder } = useOrderStore();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSuggestions, setClientSuggestions] = useState<string[]>([]);
  const [allClients, setAllClients] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderFormData>({
    defaultValues: {
      title: '',
      clientName: '',
      amount: '',
      dueDate: '',
      priority: 'medium',
      tags: '',
    },
  });

  const clientNameValue = watch('clientName');

  // Load client history for autocomplete
  useEffect(() => {
    getUniqueClients()
      .then(setAllClients)
      .catch(() => setAllClients([]));
  }, []);


  // Filter client suggestions based on input
  useEffect(() => {
    if (clientNameValue && clientNameValue.length > 0) {
      const filtered = allClients.filter((client) =>
        client.toLowerCase().includes(clientNameValue.toLowerCase())
      );
      setClientSuggestions(filtered);
    } else {
      setClientSuggestions([]);
    }
  }, [clientNameValue, allClients]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        clientInputRef.current &&
        !clientInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectClient = useCallback((client: string) => {
    setValue('clientName', client);
    setShowSuggestions(false);
  }, [setValue]);

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);
    try {
      const order = await createOrder({
        title: data.title.trim(),
        clientName: data.clientName.trim() || null,
        amount: data.amount ? parseFloat(data.amount) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority,
        tags: data.tags
          ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        updatedBy: 'Никита', // TODO: Get from auth context
      });

      addOrder(order);
      showToast(`Заказ #${String(order.orderNumber).padStart(3, '0')} создан`, 'success');
      onSuccess?.();
      onClose();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Ошибка создания заказа',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Title - required */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Название *
          </label>
          <input
            {...register('title', {
              required: 'Название обязательно',
              validate: (value) =>
                value.trim().length > 0 || 'Название не может быть пустым',
            })}
            type="text"
            placeholder="Название заказа"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            autoFocus
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* Client with autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Клиент
          </label>
          <input
            {...register('clientName')}
            ref={(e) => {
              register('clientName').ref(e);
              (clientInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
            }}
            type="text"
            placeholder="Имя клиента"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            onFocus={() => setShowSuggestions(true)}
            autoComplete="off"
          />
          {showSuggestions && clientSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto"
            >
              {clientSuggestions.map((client) => (
                <button
                  key={client}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                  onClick={() => selectClient(client)}
                >
                  {client}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Сумма
          </label>
          <input
            {...register('amount')}
            type="number"
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Дедлайн
          </label>
          <input
            {...register('dueDate')}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Priority buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Приоритет
          </label>
          <div className="flex gap-1">
            {PRIORITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('priority', option.value)}
                className={`flex-1 px-2 py-2 text-sm rounded-lg border transition-colors ${
                  watch('priority') === option.value
                    ? 'bg-primary-100 border-primary-500 dark:bg-primary-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                title={option.label}
              >
                {option.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Теги (через запятую)
        </label>
        <input
          {...register('tags')}
          type="text"
          placeholder="дизайн, срочно, важно"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Создание...' : 'Создать заказ'}
        </button>
      </div>
    </form>
  );
}
