import { User } from '@/types';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';

interface SidebarProps {
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { id: 'orders', label: 'Заказы', icon: ShoppingCart },
  { id: 'clients', label: 'Клиенты', icon: Users },
  { id: 'calendar', label: 'Календарь', icon: Calendar },
  { id: 'history', label: 'История', icon: History },
  { id: 'stats', label: 'Статистика', icon: BarChart3 },
  { id: 'activity', label: 'Активность', icon: Zap },
  { id: 'archive', label: 'Архив', icon: Archive },
  { id: 'accounts', label: 'Аккаунты', icon: UserCircle },
  { id: 'settings', label: 'Настройки', icon: Settings },
];

const Sidebar = ({ user, activeTab, onTabChange, isOpen, onToggle, onLogout }: SidebarProps) => {
  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border",
          "flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 pt-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold gradient-text">TeamCRM</h1>
            <button className="text-muted-foreground hover:text-foreground transition-colors hidden lg:block">
              ←
            </button>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="mx-3 mb-4">
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-r flex items-center gap-3",
            user.color
          )}>
            <span className="text-2xl">{user.avatar}</span>
            <div>
              <p className="font-medium text-primary-foreground">{user.name}</p>
              <p className="text-xs text-primary-foreground/70">Онлайн</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 space-y-2 border-t border-sidebar-border">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Сменить пользователя</span>
          </button>
          <p className="text-xs text-center text-muted-foreground">
            © 2024 Team CRM
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
