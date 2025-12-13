'use client';

import { useState, ReactNode, useEffect } from 'react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change or resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <AuthGuard>
      <div className="flex h-screen bg-[#0a0a0f]">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(prev => !prev)} 
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 md:hidden
          transform transition-transform duration-300 ease-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar 
            collapsed={false} 
            onToggle={() => setMobileMenuOpen(false)}
            isMobile
          />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header with breadcrumbs */}
          <header className="flex-shrink-0 bg-surface-50 border-b border-surface-200">
            <div className="px-3 md:px-6 py-2 md:py-3 flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-1 rounded-lg hover:bg-surface-100 text-gray-400 touch-manipulation"
                aria-label="Открыть меню"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex-1">
                <Breadcrumb items={breadcrumbs} />
              </div>
            </div>
            
            {/* Title section if provided */}
            {(title || actions) && (
              <div className="px-3 md:px-6 pb-3 md:pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  {title && (
                    <h1 className="text-lg md:text-2xl font-bold text-gray-100 truncate">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-xs md:text-sm text-gray-500 mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
                {actions && (
                  <div className="flex items-center gap-2 flex-shrink-0">
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
