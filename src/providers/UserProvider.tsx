'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { UserSelect } from '@/components/auth/UserSelect';
import type { ParticipantName } from '@/types';

interface UserContextType {
  currentUser: ParticipantName | null;
  setCurrentUser: (user: ParticipantName) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

const STORAGE_KEY = 'team-crm-user';
const SESSION_KEY = 'team-crm-session';

// Пароли пользователей
const USER_PASSWORDS: Record<ParticipantName, string> = {
  'Никита': '1211',
  'Ксюша': '4081',
  'Саня': '2877',
};

// Генерация простого токена сессии (используем encodeURIComponent для кириллицы)
function generateSessionToken(user: ParticipantName): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return btoa(encodeURIComponent(`${user}:${timestamp}:${random}`));
}

// Проверка токена сессии
function validateSession(token: string): ParticipantName | null {
  try {
    const decoded = decodeURIComponent(atob(token));
    const [user] = decoded.split(':');
    if (['Никита', 'Саня', 'Ксюша'].includes(user)) {
      return user as ParticipantName;
    }
  } catch {
    // Invalid token
  }
  return null;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<ParticipantName | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Load user from session on mount
  useEffect(() => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (sessionToken) {
      const user = validateSession(sessionToken);
      if (user) {
        setCurrentUserState(user);
      } else {
        // Invalid session, clear it
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsHydrated(true);
  }, []);

  const handleLogin = (user: ParticipantName, password: string) => {
    setAuthError(null);
    
    const expectedPassword = USER_PASSWORDS[user];
    const passwordMatch = expectedPassword === password;
    
    console.log('Login attempt:', { user, password, expectedPassword, passwordMatch });
    
    if (passwordMatch) {
      const sessionToken = generateSessionToken(user);
      localStorage.setItem(SESSION_KEY, sessionToken);
      localStorage.setItem(STORAGE_KEY, user);
      setCurrentUserState(user);
    } else {
      setAuthError('Неверный пароль');
    }
  };

  const setCurrentUser = (user: ParticipantName) => {
    setCurrentUserState(user);
    localStorage.setItem(STORAGE_KEY, user);
  };

  const logout = () => {
    setCurrentUserState(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
  };

  // Don't render children until hydrated to avoid mismatch
  if (!isHydrated) {
    return null;
  }

  // Show login screen if not authenticated
  if (!currentUser) {
    return <UserSelect onSelect={handleLogin} error={authError} />;
  }

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated: currentUser !== null,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
