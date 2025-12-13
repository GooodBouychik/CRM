'use client';

import { useEffect, useState, useCallback, useRef, type TouchEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrderStore } from '@/stores/orderStore';
import { useConflictStore } from '@/stores/conflictStore';
import { fetchOrder, updateOrder, deleteOrder, type UpdateOrderInput } from '@/lib/api';
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
          className={`w-full px-3 py-2 bg-secondary border-0 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground ${className}`}
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
        className={`w-full px-3 py-2 bg-secondary border-0 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground ${className}`}
        autoFocus
        placeholder={placeholder}
      />
    );
  }

  return (
    <div className="relative">
      <span
        onClick={handleStartEdit}
        className={`cursor-pointer hover:bg-accent px-3 py-2 rounded-lg block ${className} ${
          otherEditor ? 'ring-2 ring-amber-400 ring-opacity-50' : ''
        }`}
        title={otherEditor ? `${otherEditor} редактирует это поле` : 'Нажмите для редактирования'}
      >
        {value || <span className="text-muted-foreground">{placeholder || 'Нажмите для редактирования'}</span>}
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
  new: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  in_progress: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  review: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

// Priority badge component
const priorityLabels: Record<Priority, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

const priorityColors: Record<Priority, string> = {
  high: 'bg-red-500/20 text-red-400 border border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  low: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
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
        <label key={name} className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={assignedTo.includes(name)}
            onChange={() => onToggle(name)}
            className="w-4 h-4 rounded border-muted-foreground bg-secondary text-primary focus:ring-primary focus:ring-offset-0"
          />
          <span className="text-sm text-foreground group-hover:text-primary transition-colors">{name}</span>
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
  const { orders, updateOrder: updateOrderInStore, deleteOrder: deleteOrderFromStore } = useOrderStore();
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
      showToast('Изменения сохранены', { type: 'success' });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Ошибка сохранения', { type: 'error' });
    }
  };

  const handleAssignmentToggle = async (name: ParticipantName) => {
    if (!order) return;
    
    const newAssignedTo = order.assignedTo.includes(name)
      ? order.assignedTo.filter((n) => n !== name)
      : [...order.assignedTo, name];
    
    await handleFieldUpdate('assignedTo', newAssignedTo);
  };

  const handleDeleteOrder = async () => {
    if (!order) return;
    
    const confirmed = window.confirm(`Удалить заказ #${String(order.orderNumber).padStart(3, '0')} "${order.title}"?`);
    if (!confirmed) return;
    
    try {
      await deleteOrder(orderId);
      deleteOrderFromStore(orderId);
      showToast('Заказ удалён', { type: 'success' });
      router.push('/');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Ошибка удаления', { type: 'error' });
    }
  };

  // Get active conflict for this order
  const activeConflict = conflicts.find((c) => c.orderId === orderId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <p className="text-destructive">{error || 'Order not found'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  const deadlineClass = order.dueDate ? getDeadlineClass(new Date(order.dueDate)) : '';

  return (
    <div 
      className="flex flex-col h-screen bg-background transition-transform duration-200"
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
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-20 bg-muted rounded-r-full opacity-50" />
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
      <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border bg-card">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-accent rounded-lg touch-manipulation text-muted-foreground hover:text-foreground transition-colors"
            title="Назад к списку"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <span className="text-sm text-muted-foreground font-mono">
              #{String(order.orderNumber).padStart(3, '0')}
            </span>
            <h1 className="text-xl font-bold font-mono text-foreground">
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
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[order.status]} cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary`}
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {/* Priority selector */}
          <select
            value={order.priority}
            onChange={(e) => handleFieldUpdate('priority', e.target.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${priorityColors[order.priority]} cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary`}
          >
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {/* Delete button */}
          <button
            onClick={handleDeleteOrder}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            title="Удалить заказ"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </header>


      {/* Main content - Split screen layout (stacked on mobile) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left panel - Order information */}
        <div className="w-full md:w-[380px] md:min-w-[380px] border-b md:border-b-0 md:border-r border-border bg-sidebar overflow-y-auto max-h-[40vh] md:max-h-none scrollbar-thin">
          <div className="p-4 md:p-6 space-y-5 md:space-y-6">
            {/* Client */}
            <div className="space-y-2">
              <label className="text-muted-foreground text-xs uppercase tracking-wider">
                Клиент
              </label>
              <EditableField
                value={order.clientName || ''}
                onSave={(value) => handleFieldUpdate('clientName', value || null)}
                placeholder="Имя клиента"
                className="text-foreground"
                fieldName="clientName"
                orderId={orderId}
                currentUser={currentUser}
                onStartEdit={handleStartEdit}
                onStopEdit={handleStopEdit}
                otherEditor={getOtherEditor('clientName')}
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-muted-foreground text-xs uppercase tracking-wider">
                Сумма
              </label>
              <div className="relative">
                <EditableField
                  value={order.amount?.toString() || ''}
                  onSave={(value) => handleFieldUpdate('amount', value ? parseFloat(value) : null)}
                  type="number"
                  placeholder="0"
                  className="text-foreground"
                  fieldName="amount"
                  orderId={orderId}
                  currentUser={currentUser}
                  onStartEdit={handleStartEdit}
                  onStopEdit={handleStopEdit}
                  otherEditor={getOtherEditor('amount')}
                />
                {order.amount && <span className="text-muted-foreground ml-1">₽</span>}
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <label className="text-muted-foreground text-xs uppercase tracking-wider">
                Дедлайн
              </label>
              <input
                type="date"
                value={order.dueDate ? new Date(order.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => handleFieldUpdate('dueDate', e.target.value || null)}
                className={`w-full px-3 py-2 bg-secondary border-0 rounded-lg text-foreground focus:ring-1 focus:ring-primary ${deadlineClass}`}
              />
            </div>

            {/* Assignment toggles */}
            <div className="space-y-3">
              <label className="text-muted-foreground text-xs uppercase tracking-wider">
                Кто работает
              </label>
              <AssignmentToggles
                assignedTo={order.assignedTo}
                onToggle={handleAssignmentToggle}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-muted-foreground text-xs uppercase tracking-wider">
                Теги
              </label>
              <div className="flex flex-wrap gap-1">
                {order.tags.length > 0 ? order.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-secondary text-foreground rounded text-sm"
                  >
                    {tag}
                  </span>
                )) : (
                  <span className="text-muted-foreground text-sm">Нет тегов</span>
                )}
              </div>
            </div>

            {/* Custom Fields - Requirements 9.3, 9.4 */}
            <CustomFieldInputs
              orderId={orderId}
              onError={(msg) => showToast(msg, { type: 'error' })}
              onSuccess={(msg) => showToast(msg, { type: 'success' })}
            />

            {/* Description with Markdown support and collaborative cursors */}
            <div className="space-y-2">
              <label className="text-muted-foreground text-xs uppercase tracking-wider">
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
            <div className="space-y-2">
              <label className="text-muted-foreground text-xs uppercase tracking-wider">
                Файлы
              </label>
              <FileAttachments
                orderId={orderId}
                currentUser={currentUser}
                onError={(msg) => showToast(msg, { type: 'error' })}
                onSuccess={(msg) => showToast(msg, { type: 'success' })}
              />
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-border text-sm text-muted-foreground space-y-1">
              <p>Создан: {new Date(order.createdAt).toLocaleString('ru-RU')}</p>
              <p>Обновлён: {new Date(order.updatedAt).toLocaleString('ru-RU')}</p>
              <p>Последнее изменение: {order.updatedBy}</p>
              
              {/* Show history button (Requirements 10.2, 10.3) */}
              <button
                onClick={() => setShowHistory(true)}
                className="mt-3 flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
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
          <div className="flex-1 p-2 md:p-6 overflow-hidden min-h-[200px] md:min-h-0">
            <KanbanBoard
              orderId={orderId}
              onError={(msg) => showToast(msg, { type: 'error' })}
              onSuccess={(msg) => showToast(msg, { type: 'success' })}
            />
          </div>
          
          {/* Bottom - Comments section */}
          <div className="h-auto md:h-1/3 min-h-[150px] md:min-h-[200px] border-t border-border">
            <CommentList
              orderId={orderId}
              currentUser={currentUser}
              onError={(msg) => showToast(msg, { type: 'error' })}
              onSuccess={(msg) => showToast(msg, { type: 'success' })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
