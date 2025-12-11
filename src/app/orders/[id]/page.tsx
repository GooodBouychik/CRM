'use client';

import { useEffect, useState, useCallback, useRef, type TouchEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrderStore } from '@/stores/orderStore';
import { useConflictStore } from '@/stores/conflictStore';
import { fetchOrder, updateOrder, type UpdateOrderInput } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Order, ParticipantName, OrderStatus, Priority } from '@/types';
import { getDeadlineClass } from '@/lib/orderUtils';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { FileAttachments } from '@/components/ui/FileAttachments';
import { KanbanBoard } from '@/components/kanban';
import { CommentList } from '@/components/comments';
import { ConflictWarning, FieldEditIndicator } from '@/components/ui/ConflictWarning';
import { OrderHistory } from '@/components/orders';
import { CustomFieldInputs } from '@/components/customFields';

// Inline editable field component with conflict detection
interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  type?: 'text' | 'number' | 'date' | 'textarea';
  placeholder?: string;
  className?: string;
  fieldName: string;
  orderId: string;
  currentUser: ParticipantName;
  onStartEdit: (fieldName: string) => void;
  onStopEdit: (fieldName: string) => void;
  otherEditor?: ParticipantName | null;
}

function EditableField({ 
  value, 
  onSave, 
  type = 'text', 
  placeholder, 
  className = '',
  fieldName,
  orderId,
  currentUser,
  onStartEdit,
  onStopEdit,
  otherEditor,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleStartEdit = () => {
    setIsEditing(true);
    onStartEdit(fieldName);
  };

  const handleSave = () => {
    setIsEditing(false);
    onStopEdit(fieldName);
    if (editValue !== value) {
      onSave(editValue);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    onStopEdit(fieldName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    if (type === 'textarea') {
      return (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`w-full px-2 py-1 border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 ${className}`}
          autoFocus
          rows={4}
        />
      );
    }
    return (
      <input
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`w-full px-2 py-1 border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 ${className}`}
        autoFocus
        placeholder={placeholder}
      />
    );
  }

  return (
    <div className="relative">
      <span
        onClick={handleStartEdit}
        className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded ${className} ${
          otherEditor ? 'ring-2 ring-amber-400 ring-opacity-50' : ''
        }`}
        title={otherEditor ? `${otherEditor} редактирует это поле` : 'Click to edit'}
      >
        {value || <span className="text-gray-400">{placeholder || 'Click to edit'}</span>}
      </span>
      {otherEditor && (
        <div className="absolute -bottom-5 left-0">
          <FieldEditIndicator editingBy={otherEditor} />
        </div>
      )}
    </div>
  );
}


// Status badge component
const statusLabels: Record<OrderStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  review: 'На проверке',
  completed: 'Завершён',
  rejected: 'Отклонён',
};

const statusColors: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

// Priority badge component
const priorityLabels: Record<Priority, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

const priorityColors: Record<Priority, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

// Assignment toggle component
interface AssignmentTogglesProps {
  assignedTo: ParticipantName[];
  onToggle: (name: ParticipantName) => void;
}

function AssignmentToggles({ assignedTo, onToggle }: AssignmentTogglesProps) {
  const participants: ParticipantName[] = ['Никита', 'Саня', 'Ксюша'];
  
  return (
    <div className="flex flex-col gap-2">
      {participants.map((name) => (
        <label key={name} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={assignedTo.includes(name)}
            onChange={() => onToggle(name)}
            className="w-4 h-4 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
        </label>
      ))}
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const { orders, updateOrder: updateOrderInStore } = useOrderStore();
  const { 
    setFieldEditing, 
    clearFieldEditing, 
    conflicts, 
    dismissConflict,
    getFieldEditor,
    clearOrderEdits,
  } = useConflictStore();
  
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Current user (hardcoded for now, would come from auth in real app)
  const currentUser: ParticipantName = 'Никита';

  // Swipe-to-close state for mobile
  const swipeRef = useRef<{ startX: number; startY: number; currentX: number }>({ startX: 0, startY: 0, currentX: 0 });
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipingToClose, setIsSwipingToClose] = useState(false);

  // Swipe-to-close handlers for mobile
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    swipeRef.current = { startX: touch.clientX, startY: touch.clientY, currentX: touch.clientX };
  }, [isMobile]);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeRef.current.startX;
    const deltaY = touch.clientY - swipeRef.current.startY;

    // Only swipe right to close (from left edge)
    if (!isSwipingToClose && swipeRef.current.startX < 50 && deltaX > Math.abs(deltaY) && deltaX > 10) {
      setIsSwipingToClose(true);
    }

    if (isSwipingToClose && deltaX > 0) {
      swipeRef.current.currentX = touch.clientX;
      setSwipeOffset(Math.min(deltaX, window.innerWidth));
    }
  }, [isMobile, isSwipingToClose]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile || !isSwipingToClose) return;
    
    const deltaX = swipeRef.current.currentX - swipeRef.current.startX;
    if (deltaX > window.innerWidth * 0.3) {
      // Close the page
      router.push('/');
    } else {
      // Reset
      setSwipeOffset(0);
    }
    setIsSwipingToClose(false);
    swipeRef.current = { startX: 0, startY: 0, currentX: 0 };
  }, [isMobile, isSwipingToClose, router]);

  // State for remote cursors in description field
  const [remoteCursors, setRemoteCursors] = useState<Array<{
    userName: ParticipantName;
    position: { line: number; column: number } | null;
  }>>([]);

  // WebSocket integration for real-time conflict detection and collaborative cursors
  const { 
    startFieldEdit, 
    stopFieldEdit, 
    joinOrder, 
    leaveOrder,
    moveCursor,
  } = useWebSocket({
    userName: currentUser,
    onOrderUpdated: (updatedOrder) => {
      if (updatedOrder.id === orderId) {
        setOrder(updatedOrder);
        updateOrderInStore(orderId, updatedOrder);
      }
    },
    onFieldEditing: (data) => {
      if (data.orderId === orderId && data.userName !== currentUser) {
        setFieldEditing(data.orderId, data.fieldName, data.userName);
      }
    },
    onFieldStopped: (data) => {
      if (data.orderId === orderId) {
        clearFieldEditing(data.orderId, data.fieldName, data.userName);
      }
    },
    onCursorUpdate: (data) => {
      if (data.orderId === orderId && data.userName !== currentUser) {
        setRemoteCursors((prev) => {
          const filtered = prev.filter((c) => c.userName !== data.userName);
          if (data.position) {
            return [...filtered, { userName: data.userName, position: data.position }];
          }
          return filtered;
        });
      }
    },
  });

  // Join order room on mount, leave on unmount
  useEffect(() => {
    if (orderId) {
      joinOrder(orderId);
    }
    return () => {
      if (orderId) {
        leaveOrder(orderId);
        clearOrderEdits(orderId);
      }
    };
  }, [orderId, joinOrder, leaveOrder, clearOrderEdits]);

  // Handle field edit start/stop
  const handleStartEdit = useCallback((fieldName: string) => {
    startFieldEdit(orderId, fieldName);
  }, [orderId, startFieldEdit]);

  const handleStopEdit = useCallback((fieldName: string) => {
    stopFieldEdit(orderId, fieldName);
  }, [orderId, stopFieldEdit]);

  // Get other editor for a field
  const getOtherEditor = useCallback((fieldName: string): ParticipantName | null => {
    const editor = getFieldEditor(orderId, fieldName);
    return editor && editor !== currentUser ? editor : null;
  }, [orderId, getFieldEditor, currentUser]);

  // Handle cursor movement in description field
  const handleCursorMove = useCallback((position: { line: number; column: number } | null) => {
    moveCursor({
      orderId,
      userName: currentUser,
      position,
    });
  }, [orderId, currentUser, moveCursor]);

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        // First check if order is in store
        if (orders[orderId]) {
          setOrder(orders[orderId]);
          setLoading(false);
          return;
        }
        // Otherwise fetch from API
        const fetchedOrder = await fetchOrder(orderId);
        setOrder(fetchedOrder);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId, orders]);

  const handleFieldUpdate = async (field: keyof UpdateOrderInput, value: unknown) => {
    if (!order) return;
    
    try {
      const input: UpdateOrderInput = {
        [field]: value,
        updatedBy: currentUser,
      };
      const updated = await updateOrder(orderId, input);
      setOrder(updated);
      updateOrderInStore(orderId, updated);
      showToast('Изменения сохранены', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Ошибка сохранения', 'error');
    }
  };

  const handleAssignmentToggle = async (name: ParticipantName) => {
    if (!order) return;
    
    const newAssignedTo = order.assignedTo.includes(name)
      ? order.assignedTo.filter((n) => n !== name)
      : [...order.assignedTo, name];
    
    await handleFieldUpdate('assignedTo', newAssignedTo);
  };

  // Get active conflict for this order
  const activeConflict = conflicts.find((c) => c.orderId === orderId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-500">{error || 'Order not found'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  const deadlineClass = order.dueDate ? getDeadlineClass(new Date(order.dueDate)) : '';

  return (
    <div 
      className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-transform duration-200"
      style={{ 
        transform: isSwipingToClose ? `translateX(${swipeOffset}px)` : 'translateX(0)',
        opacity: isSwipingToClose ? 1 - (swipeOffset / window.innerWidth) * 0.5 : 1,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe indicator for mobile */}
      {isMobile && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-20 bg-gray-300 dark:bg-gray-600 rounded-r-full opacity-50" />
      )}

      {/* Conflict Warning Toast */}
      {activeConflict && (
        <ConflictWarning
          fieldName={activeConflict.fieldName}
          otherUser={activeConflict.otherUser}
          onDismiss={() => dismissConflict(activeConflict.orderId, activeConflict.fieldName)}
        />
      )}

      {/* Header - responsive */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
            title="Назад к списку"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              #{String(order.orderNumber).padStart(3, '0')}
            </span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              <EditableField
                value={order.title}
                onSave={(value) => handleFieldUpdate('title', value)}
                placeholder="Название заказа"
                fieldName="title"
                orderId={orderId}
                currentUser={currentUser}
                onStartEdit={handleStartEdit}
                onStopEdit={handleStopEdit}
                otherEditor={getOtherEditor('title')}
              />
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status selector */}
          <select
            value={order.status}
            onChange={(e) => handleFieldUpdate('status', e.target.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]} border-0 cursor-pointer`}
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {/* Priority selector */}
          <select
            value={order.priority}
            onChange={(e) => handleFieldUpdate('priority', e.target.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[order.priority]} border-0 cursor-pointer`}
          >
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </header>


      {/* Main content - Split screen layout (stacked on mobile) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left panel - Order information */}
        <div className="w-full md:w-1/3 md:min-w-[320px] border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto max-h-[40vh] md:max-h-none">
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Клиент
              </label>
              <EditableField
                value={order.clientName || ''}
                onSave={(value) => handleFieldUpdate('clientName', value || null)}
                placeholder="Имя клиента"
                className="text-gray-900 dark:text-gray-100"
                fieldName="clientName"
                orderId={orderId}
                currentUser={currentUser}
                onStartEdit={handleStartEdit}
                onStopEdit={handleStopEdit}
                otherEditor={getOtherEditor('clientName')}
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Сумма
              </label>
              <EditableField
                value={order.amount?.toString() || ''}
                onSave={(value) => handleFieldUpdate('amount', value ? parseFloat(value) : null)}
                type="number"
                placeholder="0"
                className="text-gray-900 dark:text-gray-100"
                fieldName="amount"
                orderId={orderId}
                currentUser={currentUser}
                onStartEdit={handleStartEdit}
                onStopEdit={handleStopEdit}
                otherEditor={getOtherEditor('amount')}
              />
              {order.amount && <span className="text-gray-500 ml-1">₽</span>}
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Дедлайн
              </label>
              <input
                type="date"
                value={order.dueDate ? new Date(order.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => handleFieldUpdate('dueDate', e.target.value || null)}
                className={`px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 ${deadlineClass}`}
              />
            </div>

            {/* Assignment toggles */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Кто работает
              </label>
              <AssignmentToggles
                assignedTo={order.assignedTo}
                onToggle={handleAssignmentToggle}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Теги
              </label>
              <div className="flex flex-wrap gap-1">
                {order.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                  >
                    {tag}
                  </span>
                ))}
                {order.tags.length === 0 && (
                  <span className="text-gray-400 text-sm">Нет тегов</span>
                )}
              </div>
            </div>

            {/* Custom Fields - Requirements 9.3, 9.4 */}
            <CustomFieldInputs
              orderId={orderId}
              onError={(msg) => showToast(msg, 'error')}
              onSuccess={(msg) => showToast(msg, 'success')}
            />

            {/* Description with Markdown support and collaborative cursors */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Описание (Markdown)
              </label>
              <MarkdownEditor
                value={order.description || ''}
                onSave={(value) => handleFieldUpdate('description', value || null)}
                placeholder="Добавьте описание... (поддерживается Markdown: **жирный**, *курсив*, `код`, списки)"
                orderId={orderId}
                currentUser={currentUser}
                remoteCursors={remoteCursors}
                onCursorMove={handleCursorMove}
              />
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Файлы
              </label>
              <FileAttachments
                orderId={orderId}
                currentUser={currentUser}
                onError={(msg) => showToast(msg, 'error')}
                onSuccess={(msg) => showToast(msg, 'success')}
              />
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
              <p>Создан: {new Date(order.createdAt).toLocaleString('ru-RU')}</p>
              <p>Обновлён: {new Date(order.updatedAt).toLocaleString('ru-RU')}</p>
              <p>Последнее изменение: {order.updatedBy}</p>
              
              {/* Show history button (Requirements 10.2, 10.3) */}
              <button
                onClick={() => setShowHistory(true)}
                className="mt-3 flex items-center gap-2 text-primary-500 hover:text-primary-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Показать историю
              </button>
            </div>
          </div>
        </div>

        {/* Order History Modal (Requirements 10.2, 10.3) */}
        <OrderHistory
          orderId={orderId}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />

        {/* Right panel - Kanban board */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-2 md:p-4 overflow-hidden min-h-[200px] md:min-h-0">
            <KanbanBoard
              orderId={orderId}
              onError={(msg) => showToast(msg, 'error')}
              onSuccess={(msg) => showToast(msg, 'success')}
            />
          </div>
          
          {/* Bottom - Comments section */}
          <div className="h-auto md:h-1/3 min-h-[150px] md:min-h-[200px] border-t border-gray-200 dark:border-gray-700">
            <CommentList
              orderId={orderId}
              currentUser={currentUser}
              onError={(msg) => showToast(msg, 'error')}
              onSuccess={(msg) => showToast(msg, 'success')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
