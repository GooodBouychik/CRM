'use client';

import { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Order } from '@/types';
import { SwipeableOrderCard } from './SwipeableOrderCard';

interface MobileOrderListProps {
  orders: Order[];
  selectedOrderIds: Set<string>;
  onSelectOrder: (id: string, selected: boolean) => void;
  onOrderClick: (order: Order) => void;
  onQuickAction?: (orderId: string, action: 'complete' | 'delete' | 'archive') => void;
}

export function MobileOrderList({
  orders,
  selectedOrderIds,
  onSelectOrder,
  onOrderClick,
  onQuickAction,
}: MobileOrderListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: orders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 160, // Estimated card height
    overscan: 5,
  });

  const handleOrderClick = useCallback((order: Order) => {
    onOrderClick(order);
  }, [onOrderClick]);

  const handleQuickAction = useCallback((orderId: string, action: 'complete' | 'delete' | 'archive') => {
    onQuickAction?.(orderId, action);
  }, [onQuickAction]);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>Нет заказов</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto px-4 py-2">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const order = orders[virtualRow.index];
          return (
            <div
              key={order.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <SwipeableOrderCard
                order={order}
                isSelected={selectedOrderIds.has(order.id)}
                onSelect={(selected) => onSelectOrder(order.id, selected)}
                onClick={() => handleOrderClick(order)}
                onQuickAction={(action) => handleQuickAction(order.id, action)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
