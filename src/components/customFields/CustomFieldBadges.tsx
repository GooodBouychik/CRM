'use client';

import { useState, useEffect } from 'react';
import { fetchOrderCustomFields, type CustomFieldWithValue } from '@/lib/api';

interface CustomFieldBadgesProps {
  orderId: string;
  maxDisplay?: number;
}

export function CustomFieldBadges({ orderId, maxDisplay = 2 }: CustomFieldBadgesProps) {
  const [fieldsWithValues, setFieldsWithValues] = useState<CustomFieldWithValue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFields();
  }, [orderId]);

  const loadFields = async () => {
    try {
      const data = await fetchOrderCustomFields(orderId);
      // Only show fields that have values
      setFieldsWithValues(data.filter((item) => item.value?.value));
    } catch {
      // Silently fail - badges are not critical
    } finally {
      setLoading(false);
    }
  };

  if (loading || fieldsWithValues.length === 0) {
    return null;
  }

  const displayFields = fieldsWithValues.slice(0, maxDisplay);
  const remainingCount = fieldsWithValues.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1 animate-fade-in">
      {displayFields.map((item, index) => (
        <span
          key={item.field.id}
          className="inline-flex items-center px-2 py-0.5 text-xs bg-accent-500/20 text-accent-300 rounded transition-all duration-200 hover:bg-accent-500/30"
          style={{ animationDelay: `${index * 50}ms` }}
          title={`${item.field.name}: ${item.value?.value}`}
        >
          <span className="font-medium mr-1">{item.field.name}:</span>
          <span className="truncate max-w-[80px]">{item.value?.value}</span>
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-gray-500">+{remainingCount}</span>
      )}
    </div>
  );
}

export default CustomFieldBadges;
