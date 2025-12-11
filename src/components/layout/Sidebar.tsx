'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@/providers/UserProvider';
import type { ParticipantName } from '@/types';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  description?: string;
}

export interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Дашборд', icon: '📊', path: '/dashboard', description: 'Персональный обзор' },
  { id: 'orders', label: 'Заказы', icon: '📋', path: '/', description: 'Список всех заказов' },
  { id: 'clients', label: 'Клиенты', icon: '👥', path: '/clients', description: 'Карточки клиентов' },
  { id: 'calendar', label: 'Календарь', icon: '📅', path: '/calendar', description: 'Календарь подзадач' },
  { id: 'history', label: 'История', icon: '📜', path: '/history', description: 'История заказов' },
  { id: 'statistics', label: 'Статистика', icon: '📈', path: '/statistics', description: 'Аналитика и отчёты' },
  { id: 'activity', label: 'Активность', icon: '⚡', path: '/activity', description: 'Лента действий' },
  { id: 'archive', label: 'Архив', icon: '📁', path: '/archive', description: 'Завершённые заказы' },
  { id: 'accounts', label: 'Аккаунты', icon: '🔐', path: '/accounts', description: 'Хранилище паролей' },
  { id: 'settings', label: 'Настройки', icon: '⚙️', path: '/settings', description: 'Кастомные поля' },
];

const userStyles: Record<ParticipantName, { gradient: string; emoji: string }> = {
  'Никита': { gradient: 'from-orange-500 to-amber-500', emoji: '🦊' },
  'Ксюша': { gradient: 'from-violet-500 to-purple-500', emoji: '🦋' },
  'Саня': { gradient: 'from-cyan-500 to-blue-500', emoji: '🐺' },
};

export function Sidebar({ collapsed: controlledCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, logout } = useUser();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const userStyle = currentUser ? userStyles[currentUser] : null;
  
  const handleToggle = useCallback(() => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalCollapsed(prev => !prev);
    }
  }, [onToggle]);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <aside
      className={`
        flex flex-col h-full bg-surface-50 border-r border-surface-200
        transition-all duration-300 ease-out
        ${collapsed ? 'w-20' : 'w-72'}
      `}
    >
      {/* Header with logo */}
      <div className="flex items-center justify-between p-5 border-b border-surface-200">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-orange-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Team
              </span>
              <span className="text-gray-300">CRM</span>
            </span>
          </Link>
        )}
        <button
          onClick={handleToggle}
          className={`
            p-2.5 rounded-xl text-gray-500 hover:text-gray-300
            hover:bg-surface-100 transition-all duration-200
            ${collapsed ? 'mx-auto' : ''}
          `}
          title={collapsed ? 'Развернуть' : 'Свернуть'}
        >
          <motion.span
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="block"
          >
            ←
          </motion.span>
        </button>
      </div>

      {/* User card */}
      {currentUser && userStyle && (
        <div className={`p-4 ${collapsed ? 'px-3' : ''}`}>
          <div className={`
            relative overflow-hidden rounded-2xl p-4
            bg-gradient-to-br ${userStyle.gradient} bg-opacity-10
            border border-white/10
            ${collapsed ? 'p-3' : ''}
          `}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-xl">{userStyle.emoji}</span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{currentUser}</p>
                  <p className="text-xs text-white/60">Онлайн</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`
                group relative flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200 ease-out
                ${active
                  ? 'bg-accent-500/10 text-accent-400'
                  : 'text-gray-400 hover:bg-surface-100 hover:text-gray-200'
                }
                ${collapsed ? 'justify-center px-3' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-500 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              
              {!collapsed && (
                <>
                  <span className="font-medium">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              
              {/* Tooltip for collapsed */}
              {collapsed && (
                <div className="
                  absolute left-full ml-3 px-3 py-2 bg-surface-100 text-gray-200 text-sm rounded-xl
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  transition-all duration-200 whitespace-nowrap z-50
                  shadow-xl border border-surface-200
                ">
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                  )}
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-surface-100" />
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-surface-200">
        {currentUser && (
          <button
            onClick={logout}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              text-gray-500 hover:text-gray-300 hover:bg-surface-100
              transition-all duration-200
              ${collapsed ? 'justify-center px-3' : ''}
            `}
            title={collapsed ? 'Выйти' : undefined}
          >
            <span className="text-lg">🚪</span>
            {!collapsed && <span className="text-sm">Сменить пользователя</span>}
          </button>
        )}
        {!collapsed && (
          <p className="text-xs text-gray-600 text-center mt-3">
            © 2024 Team CRM
          </p>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
