'use client';

import { useState, useCallback } from 'react';

export interface PeriodFilterValue {
  from: string;
  to: string;
}

interface PeriodFilterProps {
  value: PeriodFilterValue;
  onChange: (value: PeriodFilterValue) => void;
}

// Preset periods
const presets = [
  { label: '3 месяца', months: 3 },
  { label: '6 месяцев', months: 6 },
  { label: '12 месяцев', months: 12 },
] as const;

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const [activePreset, setActivePreset] = useState<number | null>(12);

  const handlePresetClick = useCallback((months: number) => {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - months + 1);
    from.setDate(1);

    setActivePreset(months);
    onChange({
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    });
  }, [onChange]);

  const handleDateChange = useCallback((field: 'from' | 'to', dateValue: string) => {
    setActivePreset(null);
    onChange({
      ...value,
      [field]: dateValue,
    });
  }, [value, onChange]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Preset buttons */}
      <div className="flex bg-surface-100 rounded-xl p-1">
        {presets.map((preset) => (
          <button
            key={preset.months}
            onClick={() => handlePresetClick(preset.months)}
            className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
              activePreset === preset.months
                ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={value.from}
          onChange={(e) => handleDateChange('from', e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-surface-200 bg-surface-100 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
        />
        <span className="text-gray-500">—</span>
        <input
          type="date"
          value={value.to}
          onChange={(e) => handleDateChange('to', e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-surface-200 bg-surface-100 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
        />
      </div>
    </div>
  );
}
