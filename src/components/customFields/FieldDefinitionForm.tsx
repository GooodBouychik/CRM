'use client';

import { useState, useEffect } from 'react';
import type {
  CustomFieldDefinition,
  CreateCustomFieldInput,
  UpdateCustomFieldInput,
  CustomFieldType,
} from '@/lib/api';

interface FieldDefinitionFormProps {
  field?: CustomFieldDefinition | null;
  onSubmit: (input: CreateCustomFieldInput | UpdateCustomFieldInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const FIELD_TYPES: { value: CustomFieldType; label: string; description: string }[] = [
  { value: 'text', label: 'Текст', description: 'Произвольный текст' },
  { value: 'select', label: 'Выбор', description: 'Выбор из списка вариантов' },
  { value: 'date', label: 'Дата', description: 'Выбор даты' },
  { value: 'number', label: 'Число', description: 'Числовое значение' },
];

export function FieldDefinitionForm({
  field,
  onSubmit,
  onCancel,
  isLoading = false,
}: FieldDefinitionFormProps) {
  const [name, setName] = useState(field?.name || '');
  const [type, setType] = useState<CustomFieldType>(field?.type || 'text');
  const [options, setOptions] = useState<string[]>(field?.options || []);
  const [newOption, setNewOption] = useState('');
  const [isRequired, setIsRequired] = useState(field?.isRequired || false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (field) {
      setName(field.name);
      setType(field.type);
      setOptions(field.options || []);
      setIsRequired(field.isRequired);
    }
  }, [field]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Название обязательно';
    }

    if (type === 'select' && options.length === 0) {
      newErrors.options = 'Добавьте хотя бы один вариант';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const input: CreateCustomFieldInput | UpdateCustomFieldInput = {
      name: name.trim(),
      type,
      options: type === 'select' ? options : undefined,
      isRequired,
    };

    onSubmit(input);
  };

  const handleAddOption = () => {
    const trimmed = newOption.trim();
    if (trimmed && !options.includes(trimmed)) {
      setOptions((prev) => [...prev, trimmed]);
      setNewOption('');
      if (errors.options) {
        setErrors((prev) => ({ ...prev, options: '' }));
      }
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddOption();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      <h3 className="text-lg font-medium text-gray-100">
        {field ? 'Редактировать поле' : 'Новое поле'}
      </h3>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Название <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
          }}
          placeholder="Например: Тип работы, Источник клиента"
          className={`w-full px-3 py-2 rounded-lg border ${
            errors.name
              ? 'border-red-500 focus:ring-red-500'
              : 'border-surface-200 focus:ring-accent-500'
          } bg-surface-100 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{errors.name}</p>
        )}
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Тип поля <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FIELD_TYPES.map((fieldType) => (
            <button
              key={fieldType.value}
              type="button"
              onClick={() => setType(fieldType.value)}
              className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                type === fieldType.value
                  ? 'border-accent-500 bg-accent-500/10'
                  : 'border-surface-200 hover:bg-surface-100 hover:border-surface-300'
              }`}
            >
              <div className="font-medium text-gray-100">
                {fieldType.label}
              </div>
              <div className="text-xs text-gray-400">
                {fieldType.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Options for select type */}
      {type === 'select' && (
        <div className="animate-slide-up">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Варианты <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Добавить вариант"
              className="flex-1 px-3 py-2 rounded-lg border border-surface-200 bg-surface-100 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all"
            />
            <button
              type="button"
              onClick={handleAddOption}
              className="px-4 py-2 bg-surface-200 text-gray-300 rounded-lg hover:bg-surface-300 transition-colors"
            >
              Добавить
            </button>
          </div>
          {options.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {options.map((option, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-surface-200 text-gray-300 rounded-lg text-sm animate-scale-in"
                >
                  {option}
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="p-0.5 hover:bg-surface-300 rounded transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
          {errors.options && (
            <p className="mt-1 text-sm text-red-400">{errors.options}</p>
          )}
        </div>
      )}

      {/* Required checkbox */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="w-4 h-4 text-accent-500 rounded border-surface-200 bg-surface-100 focus:ring-accent-500"
          />
          <span className="text-sm text-gray-300">
            Обязательное поле
          </span>
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Обязательные поля должны быть заполнены при редактировании заказа
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-gray-300 bg-surface-200 rounded-lg hover:bg-surface-300 transition-all duration-200 disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 active:scale-[0.97]"
        >
          {isLoading && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {field ? 'Сохранить' : 'Создать'}
        </button>
      </div>
    </form>
  );
}

export default FieldDefinitionForm;
