'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { useUser } from '@/providers/UserProvider';
import type { ParticipantName } from '@/types';

interface ActivityEntry {
  id: string;
  type: 'order_created' | 'order_updated' | 'status_changed' | 'comment_added' | 'task_created' | 'task_completed';
  actor: ParticipantName;
  orderId: string | null;
  orderTitle: string | null;
  taskId: string | null;
  taskTitle: string | null;
  details: string | null;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const actorColors: Record<ParticipantName, { bg: string; text: string; emoji: string }> = {
  'Никита': { bg: 'bg-orange-500/20', text: 'text-orange-400', emoji: '🦊' },
  'Ксюша': { bg: 'bg-violet-500/20', text: 'text-violet-400', emoji: '🦋' },
  'Саня': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', emoji: '🐺' },
};

const typeConfig: Record<ActivityEntry['type'], { icon: string; label: string; color: string }> = {
  order_created: { icon: '📋', label: 'создал заказ', color: 'text-emerald-400' },
  order_updated: { icon: '✏️', label: 'обновил заказ', color: 'text-blue-400' },
  status_changed: { icon: '🔄', label: 'изменил статус', color: 'text-amber-400' },
  comment_added: { icon: '💬', label: 'оставил комментарий', color: 'text-purple-400' },
  task_created: { icon: '✓', label: 'создал задачу', color: 'text-cyan-400' },
  task_completed: { icon: '✅', label: 'завершил задачу', color: 'text-emerald-400' },
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days < 7) return `${days} дн. назад`;
  
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function groupByDate(activities: ActivityEntry[]): Map<string, ActivityEntry[]> {
  const groups = new Map<string, ActivityEntry[]>();
  
  activities.forEach(activity => {
    const date = new Date(activity.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Вчера';
    } else {
      key = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    }
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(activity);
  });
  
  return groups;
}

export default function ActivityPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ParticipantName | 'all'>('all');

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/activity?limit=100`);
        if (res.ok) {
          const data = await res.json();
          setActivities(data);
        }
      } catch (err) {
        console.error('Failed to fetch activity:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, []);

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.actor === filter);
  
  const groupedActivities = groupByDate(filteredActivities);

  const handleActivityClick = (activity: ActivityEntry) => {
    if (activity.orderId) {
      router.push(`/orders/${activity.orderId}`);
    }
  };

  return (
    <AppLayout
      title="Активность"
      subtitle="Последние действия команды"
      actions={
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ParticipantName | 'all')}
            className="px-3 py-2 bg-surface-100 border border-surface-200 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-accent-500"
          >
            <option value="all">Все</option>
            <option value="Никита">🦊 Никита</option>
            <option value="Ксюша">🦋 Ксюша</option>
            <option value="Саня">🐺 Саня</option>
          </select>
        </div>
      }
    >
      <div className="p-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="w-10 h-10 bg-surface-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-100 rounded w-3/4" />
                  <div className="h-3 bg-surface-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <span className="text-6xl mb-4 block">📭</span>
            <h3 className="text-xl font-semibold text-gray-200 mb-2">Пока нет активности</h3>
            <p className="text-gray-500">Действия команды появятся здесь</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from(groupedActivities.entries()).map(([date, items]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-gray-500 mb-4 sticky top-0 bg-[#0a0a0f] py-2 z-10">
                  {date}
                </h3>
                <div className="space-y-3">
                  <AnimatePresence>
                    {items.map((activity, index) => {
                      const actorStyle = actorColors[activity.actor];
                      const typeStyle = typeConfig[activity.type];
                      
                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleActivityClick(activity)}
                          className={`
                            group flex gap-4 p-4 rounded-2xl
                            bg-surface-50 border border-surface-200
                            hover:border-surface-300 hover:bg-surface-100
                            transition-all duration-200
                            ${activity.orderId ? 'cursor-pointer' : ''}
                          `}
                        >
                          {/* Avatar */}
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                            ${actorStyle.bg}
                          `}>
                            <span className="text-lg">{actorStyle.emoji}</span>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-medium ${actorStyle.text}`}>
                                {activity.actor}
                              </span>
                              <span className="text-gray-500">{typeStyle.label}</span>
                              {activity.orderTitle && (
                                <span className="text-gray-300 truncate max-w-[200px]">
                                  «{activity.orderTitle}»
                                </span>
                              )}
                              {activity.taskTitle && (
                                <span className="text-gray-300 truncate max-w-[200px]">
                                  «{activity.taskTitle}»
                                </span>
                              )}
                            </div>
                            
                            {activity.details && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {activity.details}
                              </p>
                            )}
                            
                            <p className="text-xs text-gray-600 mt-2">
                              {formatTimeAgo(activity.createdAt)}
                            </p>
                          </div>
                          
                          {/* Type icon */}
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                            bg-surface-100 group-hover:bg-surface-200 transition-colors
                          `}>
                            <span>{typeStyle.icon}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
