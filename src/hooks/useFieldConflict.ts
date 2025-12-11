'use client';

import { useCallback, useEffect } from 'react';
import { useConflictStore } from '@/stores/conflictStore';
import type { ParticipantName } from '@/types';

interface UseFieldConflictOptions {
  orderId: string;
  fieldName: string;
  currentUser: ParticipantName;
  startFieldEdit: (orderId: string, fieldName: string) => void;
  stopFieldEdit: (orderId: string, fieldName: string) => void;
}

interface UseFieldConflictReturn {
  isBeingEditedByOther: boolean;
  otherEditor: ParticipantName | null;
  onStartEdit: () => void;
  onStopEdit: () => void;
}

export function useFieldConflict({
  orderId,
  fieldName,
  currentUser,
  startFieldEdit,
  stopFieldEdit,
}: UseFieldConflictOptions): UseFieldConflictReturn {
  const { 
    isFieldBeingEdited, 
    getFieldEditor, 
    startMyEdit, 
    stopMyEdit 
  } = useConflictStore();

  const isBeingEditedByOther = isFieldBeingEdited(orderId, fieldName, currentUser);
  const otherEditor = getFieldEditor(orderId, fieldName);
  const actualOtherEditor = otherEditor !== currentUser ? otherEditor : null;

  const onStartEdit = useCallback(() => {
    startMyEdit(orderId, fieldName);
    startFieldEdit(orderId, fieldName);
  }, [orderId, fieldName, startMyEdit, startFieldEdit]);

  const onStopEdit = useCallback(() => {
    stopMyEdit(orderId, fieldName);
    stopFieldEdit(orderId, fieldName);
  }, [orderId, fieldName, stopMyEdit, stopFieldEdit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMyEdit(orderId, fieldName);
      stopFieldEdit(orderId, fieldName);
    };
  }, [orderId, fieldName, stopMyEdit, stopFieldEdit]);

  return {
    isBeingEditedByOther,
    otherEditor: actualOtherEditor,
    onStartEdit,
    onStopEdit,
  };
}
