'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export interface BreadcrumbItem {
  label: string;
  path: string;
}

export interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  homeLabel?: string;
}

// Path to label mapping for automatic breadcrumb generation
const pathLabels: Record<string, string> = {
  '': 'Главная',
  'dashboard': 'Дашборд',
  'orders': 'Заказы',
  'archive': 'Архив',
  'accounts': 'Аккаунты',
  'settings': 'Настройки',
};

export function Breadcrumb({ items: customItems, homeLabel = 'Главная' }: BreadcrumbProps) {
  const pathname = usePathname();

  const items = useMemo(() => {
    if (customItems) {
      return customItems;
    }

    // Auto-generate breadcrumbs from pathname
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: homeLabel, path: '/' }
    ];

    let currentPath = '';
    for (const segment of segments) {
      currentPath += `/${segment}`;
      
      // Check if segment is a UUID (order detail page)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
      
      if (isUuid) {
        breadcrumbs.push({
          label: 'Детали',
          path: currentPath,
        });
      } else {
        const label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        breadcrumbs.push({
          label,
          path: currentPath,
        });
      }
    }

    return breadcrumbs;
  }, [pathname, customItems, homeLabel]);

  // Don't render if only home
  if (items.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm">
      <ol className="flex items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={item.path} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-400 dark:text-gray-500">/</span>
              )}
              {isLast ? (
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.path}
                  className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
