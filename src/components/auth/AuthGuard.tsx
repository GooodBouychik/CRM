'use client';

import { useUser } from '@/providers/UserProvider';
import { UserSelect } from './UserSelect';
import type { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { currentUser, setCurrentUser, isAuthenticated } = useUser();

  if (!isAuthenticated) {
    return <UserSelect onSelect={setCurrentUser} />;
  }

  return <>{children}</>;
}
