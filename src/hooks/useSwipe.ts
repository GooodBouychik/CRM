'use client';

import { useState, useRef, useCallback, type TouchEvent } from 'react';

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  isSwiping: boolean;
}

interface UseSwipeOptions {
  threshold?: number; // Minimum distance to trigger swipe
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  preventScroll?: boolean;
}

interface UseSwipeReturn {
  swipeOffset: number;
  isSwiping: boolean;
  handlers: {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: (e: TouchEvent) => void;
  };
  reset: () => void;
}

export function useSwipe({
  threshold = 80,
  onSwipeLeft,
  onSwipeRight,
  preventScroll = false,
}: UseSwipeOptions = {}): UseSwipeReturn {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeState = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    isSwiping: false,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    swipeState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      isSwiping: false,
    };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.current.startX;
    const deltaY = touch.clientY - swipeState.current.startY;

    // Only start swiping if horizontal movement is greater than vertical
    if (!swipeState.current.isSwiping) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        swipeState.current.isSwiping = true;
        setIsSwiping(true);
      }
    }

    if (swipeState.current.isSwiping) {
      if (preventScroll) {
        e.preventDefault();
      }
      swipeState.current.currentX = touch.clientX;
      setSwipeOffset(deltaX);
    }
  }, [preventScroll]);

  const handleTouchEnd = useCallback(() => {
    const deltaX = swipeState.current.currentX - swipeState.current.startX;

    if (swipeState.current.isSwiping) {
      if (deltaX < -threshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (deltaX > threshold && onSwipeRight) {
        onSwipeRight();
      }
    }

    // Reset state
    swipeState.current = {
      startX: 0,
      startY: 0,
      currentX: 0,
      isSwiping: false,
    };
    setSwipeOffset(0);
    setIsSwiping(false);
  }, [threshold, onSwipeLeft, onSwipeRight]);

  const reset = useCallback(() => {
    setSwipeOffset(0);
    setIsSwiping(false);
    swipeState.current = {
      startX: 0,
      startY: 0,
      currentX: 0,
      isSwiping: false,
    };
  }, []);

  return {
    swipeOffset,
    isSwiping,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    reset,
  };
}
