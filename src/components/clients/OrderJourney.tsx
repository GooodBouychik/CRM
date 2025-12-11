'use client';

import type { OrderJourneyStep } from '@/lib/api';

export interface OrderJourneyProps {
  steps: OrderJourneyStep[];
  compact?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  new: { label: 'Новый', color: 'text-blue-400', bgColor: 'bg-blue-500', icon: '🆕' },
  in_progress: { label: 'В работе', color: 'text-yellow-400', bgColor: 'bg-yellow-500', icon: '⚙️' },
  review: { label: 'Проверка', color: 'text-purple-400', bgColor: 'bg-purple-500', icon: '👀' },
  completed: { label: 'Готов', color: 'text-green-400', bgColor: 'bg-green-500', icon: '✅' },
  rejected: { label: 'Отклонён', color: 'text-red-400', bgColor: 'bg-red-500', icon: '❌' },
};

export function OrderJourney({ steps, compact = false }: OrderJourneyProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {steps.map((step, index) => {
          const config = statusConfig[step.status] || statusConfig.new;
          return (
            <div key={index} className="flex items-center">
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs
                  ${step.isCurrent ? config.bgColor : 'bg-surface-200'}
                  ${step.isCurrent ? 'ring-2 ring-offset-2 ring-offset-surface-50 ring-accent-500' : ''}
                `}
                title={`${config.label} - ${formatDate(step.changedAt)} (${step.changedBy})`}
              >
                <span className="text-[10px]">{config.icon}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-4 h-0.5 bg-surface-200" />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-surface-200" />
      
      <div className="space-y-4">
        {steps.map((step, index) => {
          const config = statusConfig[step.status] || statusConfig.new;
          return (
            <div 
              key={index} 
              className="relative flex items-start gap-4 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Status node */}
              <div
                className={`
                  relative z-10 w-8 h-8 rounded-full flex items-center justify-center
                  ${step.isCurrent ? config.bgColor : 'bg-surface-100 border-2 border-surface-200'}
                  ${step.isCurrent ? 'ring-4 ring-offset-2 ring-offset-surface-50 ring-accent-500/30 animate-pulse-soft' : ''}
                  transition-all duration-300
                `}
              >
                <span className="text-sm">{config.icon}</span>
              </div>
              
              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${step.isCurrent ? config.color : 'text-gray-400'}`}>
                    {config.label}
                  </span>
                  {step.isCurrent && (
                    <span className="px-2 py-0.5 text-xs bg-accent-500/20 text-accent-400 rounded-full animate-fade-in">
                      Текущий
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <span>{formatDate(step.changedAt)}</span>
                  <span>•</span>
                  <span>{step.changedBy}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OrderJourney;
