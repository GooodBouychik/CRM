import { useEffect, useCallback, useRef } from 'react';

interface UseNotificationBadgeOptions {
  count: number;
  title?: string;
  enableDesktopNotifications?: boolean;
}

/**
 * Hook for managing browser notification badge and desktop notifications
 * - Updates document title with unread count
 * - Shows desktop notifications when tab is not focused
 * 
 * Requirements 9.4:
 * - Show unread count on tab
 * - Desktop notifications when tab not focused
 */
export function useNotificationBadge({
  count,
  title = 'Team CRM',
  enableDesktopNotifications = true,
}: UseNotificationBadgeOptions) {
  const previousCountRef = useRef(count);
  const isTabFocusedRef = useRef(true);

  // Update document title with badge
  useEffect(() => {
    if (count > 0) {
      document.title = `(${count}) ${title}`;
    } else {
      document.title = title;
    }
  }, [count, title]);

  // Track tab focus state
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabFocusedRef.current = document.visibilityState === 'visible';
    };

    const handleFocus = () => {
      isTabFocusedRef.current = true;
    };

    const handleBlur = () => {
      isTabFocusedRef.current = false;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);


  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  // Show desktop notification
  const showNotification = useCallback(
    async (notificationTitle: string, body: string) => {
      if (!enableDesktopNotifications) return;
      if (isTabFocusedRef.current) return;

      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      try {
        const notification = new Notification(notificationTitle, {
          body,
          icon: '/favicon.ico',
          tag: 'team-crm-notification',
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      } catch (error) {
        console.error('Failed to show notification:', error);
      }
    },
    [enableDesktopNotifications, requestPermission]
  );

  // Show notification when count increases and tab is not focused
  useEffect(() => {
    if (count > previousCountRef.current && !isTabFocusedRef.current) {
      const newItems = count - previousCountRef.current;
      showNotification(
        'Team CRM',
        `У вас ${newItems} новых срочных заказов`
      );
    }
    previousCountRef.current = count;
  }, [count, showNotification]);

  return {
    requestPermission,
    showNotification,
    isTabFocused: isTabFocusedRef.current,
  };
}
