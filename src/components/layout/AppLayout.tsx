'use client';

import { useState, ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { AuthGuard } from '@/components/auth';
import { Menu } from 'lucide-react';

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
      if (window.innerWidth >= 1024) {
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
      <div className="flex h-screen bg-background">
        {/* Mobile toggle button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Overlay for mobile */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(prev => !prev)} 
          />
        </div>

        {/* Mobile Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-40 lg:hidden
          transform transition-transform duration-300 ease-in-out
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
          <header className="flex-shrink-0 bg-card border-b border-border">
            <div className="px-4 lg:px-6 py-3 flex items-center gap-3">
              <div className="flex-1">
                <Breadcrumb items={breadcrumbs} />
              </div>
              {/* Spacer for mobile menu button */}
              <div className="lg:hidden w-10" />
            </div>
            
            {/* Title section if provided */}
            {(title || actions) && (
              <div className="px-4 lg:px-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  {title && (
                    <h1 className="text-xl lg:text-2xl font-bold text-foreground truncate">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
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
