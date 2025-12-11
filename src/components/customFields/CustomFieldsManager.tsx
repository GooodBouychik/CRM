'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import {
  fetchCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  type CustomFieldDefinition,
  type CreateCustomFieldInput,
  type UpdateCustomFieldInput,
  type CustomFieldType,
} from '@/lib/api';
import { FieldDefinitionForm } from './FieldDefinitionForm';

interface CustomFieldsManagerProps {
  onClose?: () => void;
}

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'Текст',
  select: 'Выбор',
  date: 'Дата',
  number: 'Число',
};

export function CustomFieldsManager({ onClose }: CustomFieldsManagerProps) {
  const { showToast } = useToast();
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      const data = await fetchCustomFields();
      setFields(data);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Ошибка загрузки полей',
        { type: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (input: CreateCustomFieldInput) => {
    try {
      const newField = await createCustomField(input);
      setFields((prev) => [...prev, newField]);
      setShowForm(false);
      showToast('Поле создано', { type: 'success' });
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Ошибка создания поля',
        { type: 'error' }
      );
    }
  };

  const handleUpdate = async (id: string, input: UpdateCustomFieldInput) => {
    try {
      const updated = await updateCustomField(id, input);
      setFields((prev) => prev.map((f) => (f.id === id ? updated : f)));
      setEditingField(null);
      showToast('Поле обновлено', { type: 'success' });
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Ошибка обновления поля',
        { type: 'error' }
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteCustomField(id);
      setFields((prev) => prev.filter((f) => f.id !== id));
      showToast('Поле удалено', { type: 'success' });
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Ошибка удаления поля',
        { type: 'error' }
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (field: CustomFieldDefinition) => {
    setEditingField(field);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingField(null);
  };

  return (
    <div className="bg-surface-50 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-surface-200 animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
        <h2 className="text-lg font-semibold text-gray-100">
          Кастомные поля
        </h2>
        <div className="flex items-center gap-2">
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-3 py-1.5 bg-accent-500 text-white text-sm rounded-lg hover:bg-accent-600 transition-all duration-200 flex items-center gap-1 active:scale-[0.97]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Добавить поле
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-200 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {showForm ? (
          <FieldDefinitionForm
            field={editingField}
            onSubmit={editingField 
              ? (input) => handleUpdate(editingField.id, input)
              : handleCreate
            }
            onCancel={handleFormClose}
          />
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <span className="text-5xl mb-4 block">📝</span>
            <p className="text-gray-300 mb-2 font-medium">
              Нет кастомных полей
            </p>
            <p className="text-gray-500 text-sm mb-4">
              Создайте поля для отслеживания дополнительной информации о заказах
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-all duration-200 active:scale-[0.97]"
            >
              + Создать первое поле
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center justify-between p-4 bg-surface-100 rounded-lg border border-surface-200 hover:border-surface-300 transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-100">
                      {field.name}
                    </span>
                    {field.isRequired && (
                      <span className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                        Обязательное
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                    <span className="px-2 py-0.5 bg-surface-200 rounded text-xs">
                      {FIELD_TYPE_LABELS[field.type]}
                    </span>
                    {field.type === 'select' && field.options && (
                      <span className="truncate max-w-[200px]">
                        Варианты: {field.options.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(field)}
                    className="p-2 hover:bg-surface-200 rounded-lg transition-colors"
                    title="Редактировать"
                  >
                    <svg className="w-4 h-4 text-gray-400 hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(field.id)}
                    disabled={deletingId === field.id}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Удалить"
                  >
                    {deletingId === field.id ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                    ) : (
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomFieldsManager;
