'use client';

import { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { AuthGuard } from '@/components/auth';

export interface AppLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function AppLayout({ 
  children, 
  breadcrumbs, 
  title, 
  subtitle,
  actions 
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AuthGuard>
      <div className="flex h-screen bg-[#0a0a0f]">
        {/* Sidebar */}
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(prev => !prev)} 
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header with breadcrumbs */}
          <header className="flex-shrink-0 bg-surface-50 border-b border-surface-200">
            <div className="px-4 md:px-6 py-3">
              <Breadcrumb items={breadcrumbs} />
            </div>
            
            {/* Title section if provided */}
            {(title || actions) && (
              <div className="px-4 md:px-6 pb-4 flex items-center justify-between">
                <div>
                  {title && (
                    <h1 className="text-xl md:text-2xl font-bold text-gray-100">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
                {actions && (
                  <div className="flex items-center gap-2 md:gap-3">
                    {actions}
                  </div>
                )}
              </div>
            )}
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

export default AppLayout;
