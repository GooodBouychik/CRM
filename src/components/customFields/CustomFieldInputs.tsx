'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchOrderCustomFields,
  setOrderCustomFieldValue,
  type CustomFieldWithValue,
  type CustomFieldType,
} from '@/lib/api';

interface CustomFieldInputsProps {
  orderId: string;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export function CustomFieldInputs({ orderId, onError, onSuccess }: CustomFieldInputsProps) {
  const [fieldsWithValues, setFieldsWithValues] = useState<CustomFieldWithValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadFields();
  }, [orderId]);

  const loadFields = async () => {
    try {
      setLoading(true);
      const data = await fetchOrderCustomFields(orderId);
      setFieldsWithValues(data);
      // Initialize local values
      const values: Record<string, string> = {};
      data.forEach((item) => {
        values[item.field.id] = item.value?.value || '';
      });
      setLocalValues(values);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Ошибка загрузки полей');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async (fieldId: string, value: string) => {
    try {
      setSavingFields((prev) => new Set(prev).add(fieldId));
      await setOrderCustomFieldValue(orderId, fieldId, value);
      onSuccess?.('Поле сохранено');
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Ошибка сохранения');
    } finally {
      setSavingFields((prev) => {
        const next = new Set(prev);
        next.delete(fieldId);
        return next;
      });
    }
  }, [orderId, onError, onSuccess]);

  const handleChange = (fieldId: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleBlur = (fieldId: string) => {
    const currentValue = localValues[fieldId] || '';
    const originalValue = fieldsWithValues.find((f) => f.field.id === fieldId)?.value?.value || '';
    
    if (currentValue !== originalValue) {
      handleSave(fieldId, currentValue);
    }
  };

  const renderInput = (item: CustomFieldWithValue) => {
    const { field } = item;
    const value = localValues[field.id] || '';
    const isSaving = savingFields.has(field.id);

    const baseInputClass = `w-full px-3 py-2 rounded-lg border border-surface-200 bg-surface-100 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all duration-200 ${
      isSaving ? 'opacity-50' : ''
    }`;

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            onBlur={() => handleBlur(field.id)}
            disabled={isSaving}
            placeholder={`Введите ${field.name.toLowerCase()}`}
            className={baseInputClass}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            onBlur={() => handleBlur(field.id)}
            disabled={isSaving}
            placeholder="0"
            className={baseInputClass}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => {
              handleChange(field.id, e.target.value);
              // Save immediately for date inputs
              handleSave(field.id, e.target.value);
            }}
            disabled={isSaving}
            className={baseInputClass}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => {
              handleChange(field.id, e.target.value);
              // Save immediately for select inputs
              handleSave(field.id, e.target.value);
            }}
            disabled={isSaving}
            className={baseInputClass}
          >
            <option value="">Выберите...</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 w-24 bg-surface-200 rounded mb-1"></div>
            <div className="h-10 bg-surface-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (fieldsWithValues.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h4 className="text-sm font-medium text-gray-400">
        Дополнительные поля
      </h4>
      {fieldsWithValues.map((item, index) => (
        <div key={item.field.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {item.field.name}
            {item.field.isRequired && <span className="text-red-400 ml-1">*</span>}
            {savingFields.has(item.field.id) && (
              <span className="ml-2 text-xs text-accent-400 animate-pulse">Сохранение...</span>
            )}
          </label>
          {renderInput(item)}
        </div>
      ))}
    </div>
  );
}

export default CustomFieldInputs;
