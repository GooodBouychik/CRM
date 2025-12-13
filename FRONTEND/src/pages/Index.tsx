import { useState } from 'react';
import type { User, ParticipantName } from '@/types';
import { users } from '@/data/mockData';
import ProfileSelect from '@/components/ProfileSelect';
import PasswordLogin from '@/components/PasswordLogin';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import OrdersPage from '@/components/OrdersPage';
import ClientsPage from '@/components/ClientsPage';
import CalendarPage from '@/components/CalendarPage';
import StatisticsPage from '@/components/StatisticsPage';
import ActivityPage from '@/components/ActivityPage';
import ArchivePage from '@/components/ArchivePage';
import AccountsPage from '@/components/AccountsPage';
import SettingsPage from '@/components/SettingsPage';
import HistoryPage from '@/components/HistoryPage';

type AuthStep = 'select' | 'password' | 'dashboard';

const Index = () => {
  const [authStep, setAuthStep] = useState<AuthStep>('select');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setAuthStep('password');
  };

  const handleLogin = () => {
    setAuthStep('dashboard');
  };

  const handleLogout = () => {
    setSelectedUser(null);
    setAuthStep('select');
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    if (!selectedUser) return null;

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={selectedUser} />;
      case 'orders':
        return <OrdersPage currentUser={selectedUser.name as ParticipantName} />;
      case 'clients':
        return <ClientsPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'history':
        return <HistoryPage />;
      case 'stats':
        return <StatisticsPage />;
      case 'activity':
        return <ActivityPage />;
      case 'archive':
        return <ArchivePage />;
      case 'accounts':
        return <AccountsPage />;
      case 'settings':
        return <SettingsPage currentUser={selectedUser.name} />;
      default:
        return <Dashboard user={selectedUser} />;
    }
  };

  // Profile selection screen
  if (authStep === 'select') {
    return <ProfileSelect users={users} onSelect={handleUserSelect} />;
  }

  // Password login screen
  if (authStep === 'password' && selectedUser) {
    return (
      <PasswordLogin
        user={selectedUser}
        onBack={() => setAuthStep('select')}
        onLogin={handleLogin}
      />
    );
  }

  // Main dashboard
  if (authStep === 'dashboard' && selectedUser) {
    return (
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar
          user={selectedUser}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />
        <main className="flex-1 lg:ml-0 min-h-screen overflow-x-hidden">
          <div className="pt-16 lg:pt-0">
            {renderContent()}
          </div>
        </main>
      </div>
    );
  }

  return null;
};

export default Index;
