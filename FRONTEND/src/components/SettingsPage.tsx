import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Settings, Bell, Palette, Database, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SettingsPageProps {
  currentUser?: string;
}

const SettingsPage = ({ currentUser = 'Никита' }: SettingsPageProps) => {
  const [activeSection, setActiveSection] = useState('notifications');
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    newOrder: true,
    comments: true,
    statusChanges: true,
    mentions: true,
    deadlineReminders: true,
  });

  // Quiet hours
  const [quietHours, setQuietHours] = useState({
    enabled: false,
    start: '22:00',
    end: '08:00',
  });

  // Daily digest
  const [dailyDigest, setDailyDigest] = useState({
    enabled: true,
    time: '09:00',
  });

  const sections = [
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'appearance', label: 'Внешний вид', icon: Palette },
    { id: 'account', label: 'Аккаунт', icon: User },
    { id: 'data', label: 'Данные', icon: Database },
    { id: 'security', label: 'Безопасность', icon: Shield },
  ];

  const handleSave = () => {
    toast.success('Настройки сохранены');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground mb-1">Главная / Настройки</p>
        <h1 className="text-2xl lg:text-3xl font-bold">Настройки</h1>
        <p className="text-muted-foreground text-sm mt-1">Управление настройками приложения</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border p-2">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <button key={section.id} onClick={() => setActiveSection(section.id)}
                  className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                    activeSection === section.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                  <Icon className="w-4 h-4" />{section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === 'notifications' && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Уведомления</h3>
                <div className="space-y-4">
                  {[
                    { key: 'newOrder', label: 'Новые заказы', desc: 'Уведомления о создании новых заказов' },
                    { key: 'comments', label: 'Комментарии', desc: 'Уведомления о новых комментариях' },
                    { key: 'statusChanges', label: 'Изменения статуса', desc: 'Уведомления об изменении статуса заказов' },
                    { key: 'mentions', label: 'Упоминания', desc: 'Уведомления когда вас упоминают' },
                    { key: 'deadlineReminders', label: 'Напоминания о дедлайнах', desc: 'Напоминания о приближающихся дедлайнах' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <button onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                        className={cn("w-12 h-6 rounded-full transition-colors relative",
                          notifications[item.key as keyof typeof notifications] ? "bg-primary" : "bg-muted")}>
                        <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                          notifications[item.key as keyof typeof notifications] ? "translate-x-7" : "translate-x-1")} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-semibold mb-4">Тихие часы</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Включить тихие часы</p>
                      <p className="text-sm text-muted-foreground">Отключить уведомления в указанное время</p>
                    </div>
                    <button onClick={() => setQuietHours(prev => ({ ...prev, enabled: !prev.enabled }))}
                      className={cn("w-12 h-6 rounded-full transition-colors relative", quietHours.enabled ? "bg-primary" : "bg-muted")}>
                      <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", quietHours.enabled ? "translate-x-7" : "translate-x-1")} />
                    </button>
                  </div>
                  {quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Начало</label>
                        <input type="time" value={quietHours.start} onChange={(e) => setQuietHours(prev => ({ ...prev, start: e.target.value }))}
                          className="w-full h-10 px-3 bg-muted border border-border rounded-lg text-foreground" />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Конец</label>
                        <input type="time" value={quietHours.end} onChange={(e) => setQuietHours(prev => ({ ...prev, end: e.target.value }))}
                          className="w-full h-10 px-3 bg-muted border border-border rounded-lg text-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-semibold mb-4">Ежедневный дайджест</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Включить дайджест</p>
                      <p className="text-sm text-muted-foreground">Получать ежедневную сводку</p>
                    </div>
                    <button onClick={() => setDailyDigest(prev => ({ ...prev, enabled: !prev.enabled }))}
                      className={cn("w-12 h-6 rounded-full transition-colors relative", dailyDigest.enabled ? "bg-primary" : "bg-muted")}>
                      <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", dailyDigest.enabled ? "translate-x-7" : "translate-x-1")} />
                    </button>
                  </div>
                  {dailyDigest.enabled && (
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Время отправки</label>
                      <input type="time" value={dailyDigest.time} onChange={(e) => setDailyDigest(prev => ({ ...prev, time: e.target.value }))}
                        className="w-full max-w-xs h-10 px-3 bg-muted border border-border rounded-lg text-foreground" />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSave}>Сохранить настройки</Button>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-4">Внешний вид</h3>
              <p className="text-muted-foreground">Настройки темы и отображения (в разработке)</p>
            </div>
          )}

          {activeSection === 'account' && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-4">Аккаунт</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Текущий пользователь</label>
                  <p className="font-medium">{currentUser}</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-4">Данные</h3>
              <p className="text-muted-foreground">Управление данными (в разработке)</p>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-4">Безопасность</h3>
              <p className="text-muted-foreground">Настройки безопасности (в разработке)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
