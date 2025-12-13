'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@/providers/UserProvider';
import type { ParticipantName } from '@/types';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Calendar,
  History,
  BarChart3,
  Zap,
  Archive,
  UserCircle,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
  description?: string;
}

export interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard, path: '/dashboard', description: 'Персональный обзор' },
  { id: 'orders', label: 'Заказы', icon: ShoppingCart, path: '/', description: 'Список всех заказов' },
  { id: 'clients', label: 'Клиенты', icon: Users, path: '/clients', description: 'Карточки клиентов' },
  { id: 'calendar', label: 'Календарь', icon: Calendar, path: '/calendar', description: 'Календарь подзадач' },
  { id: 'history', label: 'История', icon: History, path: '/history', description: 'История заказов' },
  { id: 'statistics', label: 'Статистика', icon: BarChart3, path: '/statistics', description: 'Аналитика и отчёты' },
  { id: 'activity', label: 'Активность', icon: Zap, path: '/activity', description: 'Лента действий' },
  { id: 'archive', label: 'Архив', icon: Archive, path: '/archive', description: 'Завершённые заказы' },
  { id: 'accounts', label: 'Аккаунты', icon: UserCircle, path: '/accounts', description: 'Хранилище паролей' },
  { id: 'settings', label: 'Настройки', icon: Settings, path: '/settings', description: 'Кастомные поля' },
];

const userStyles: Record<ParticipantName, { gradient: string; emoji: string }> = {
  'Никита': { gradient: 'from-orange-500 to-amber-500', emoji: '🦊' },
  'Ксюша': { gradient: 'from-violet-500 to-purple-500', emoji: '🦋' },
  'Саня': { gradient: 'from-cyan-500 to-blue-500', emoji: '🐺' },
};

export function Sidebar({ collapsed: controlledCollapsed, onToggle, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, logout } = useUser();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  
  const collapsed = isMobile ? false : (controlledCollapsed ?? internalCollapsed);
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
        flex flex-col h-full bg-sidebar border-r border-sidebar-border
        transition-all duration-300 ease-out
        ${collapsed ? 'w-20' : 'w-64'}
        ${isMobile ? 'w-64 max-w-[85vw]' : ''}
      `}
    >
      {/* Logo */}
      <div className="p-4 pt-5">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h1 className="text-xl font-bold gradient-text">TeamCRM</h1>
          )}
          <button
            onClick={handleToggle}
            className={`
              p-2 rounded-lg text-muted-foreground hover:text-foreground
              hover:bg-sidebar-accent transition-all duration-200
              ${collapsed ? 'mx-auto' : ''}
            `}
            title={isMobile ? 'Закрыть' : collapsed ? 'Развернуть' : 'Свернуть'}
          >
            {isMobile ? (
              <X className="w-5 h-5" />
            ) : (
              <motion.div
                animate={{ rotate: collapsed ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.div>
            )}
          </button>
        </div>
      </div>

      {/* User Profile Card */}
      {currentUser && userStyle && (
        <div className={`mx-3 mb-4 ${collapsed ? 'mx-2' : ''}`}>
          <div className={`
            p-3 rounded-xl bg-gradient-to-r flex items-center gap-3
            ${userStyle.gradient}
            ${collapsed ? 'justify-center p-2' : ''}
          `}>
            <span className="text-2xl">{userStyle.emoji}</span>
            {!collapsed && (
              <div>
                <p className="font-medium text-white">{currentUser}</p>
                <p className="text-xs text-white/70">Онлайн</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.id}
              href={item.path}
              onClick={isMobile ? onToggle : undefined}
              className={`
                group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                transition-all duration-200
                ${active
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }
                ${collapsed ? 'justify-center px-2' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              
              {/* Badge */}
              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-destructive text-white rounded-full">
                  {item.badge}
                </span>
              )}
              
              {/* Tooltip for collapsed */}
              {collapsed && (
                <div className="
                  absolute left-full ml-3 px-3 py-2 bg-card text-foreground text-sm rounded-xl
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  transition-all duration-200 whitespace-nowrap z-50
                  shadow-xl border border-border
                ">
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 space-y-2 border-t border-sidebar-border">
        <button
          onClick={logout}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
            text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
            transition-colors
            ${collapsed ? 'justify-center px-2' : ''}
          `}
          title={collapsed ? 'Сменить пользователя' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Сменить пользователя</span>}
        </button>
        {!collapsed && (
          <p className="text-xs text-center text-muted-foreground">
            © 2024 Team CRM
          </p>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
