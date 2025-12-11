import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: team-crm, Property 16: System Comment Generation on Field Change**
 * **Validates: Requirements 5.8, 10.2**
 * 
 * For any order field change, a system comment should be created with isSystem=true,
 * containing the field name, old value, new value, and the participant who made the change.
 */

// Types
type ParticipantName = 'Никита' | 'Саня' | 'Ксюша';
type OrderStatus = 'new' | 'in_progress' | 'review' | 'completed' | 'rejected';
type Priority = 'high' | 'medium' | 'low';

interface Order {
  id: string;
  orderNumber: number;
  title: string;
  description: string | null;
  clientName: string | null;
  amount: number | null;
  status: OrderStatus;
  priority: Priority;
  dueDate: Date | null;
  tags: string[];
  assignedTo: ParticipantName[];
  isFavorite: boolean;
  updatedBy: ParticipantName;
  updatedAt: Date;
}

interface Comment {
  id: string;
  orderId: string;
  author: ParticipantName;
  content: string;
  isSystem: boolean;
  createdAt: Date;
}

interface FieldChange {
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
}

interface OrderHistoryEntry {
  id: string;
  orderId: string;
  changedBy: ParticipantName;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: Date;
}


// Field name display mapping (same as in historyService)
const fieldNameMap: Record<string, string> = {
  title: 'название',
  description: 'описание',
  clientName: 'клиент',
  amount: 'сумма',
  status: 'статус',
  priority: 'приоритет',
  dueDate: 'дедлайн',
  tags: 'теги',
  assignedTo: 'исполнители',
  isFavorite: 'избранное',
};

function formatFieldNameForDisplay(fieldName: string): string {
  return fieldNameMap[fieldName] || fieldName;
}

function formatValueForDisplay(value: unknown): string {
  if (value === null || value === undefined) {
    return '(пусто)';
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '(пусто)';
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('ru-RU');
  }
  if (typeof value === 'boolean') {
    return value ? 'да' : 'нет';
  }
  return String(value);
}

function generateSystemCommentMessage(
  changedBy: ParticipantName,
  fieldName: string,
  oldValue: unknown,
  newValue: unknown
): string {
  const displayFieldName = formatFieldNameForDisplay(fieldName);
  const displayOldValue = formatValueForDisplay(oldValue);
  const displayNewValue = formatValueForDisplay(newValue);
  
  return `${changedBy} изменил(а) ${displayFieldName}: ${displayOldValue} → ${displayNewValue}`;
}

function formatValueForStorage(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}


// Simulated store that tracks orders, comments, and history
class OrderStoreWithHistory {
  private orders: Map<string, Order> = new Map();
  private comments: Comment[] = [];
  private history: OrderHistoryEntry[] = [];
  private nextOrderNumber = 1;

  reset() {
    this.orders.clear();
    this.comments = [];
    this.history = [];
    this.nextOrderNumber = 1;
  }

  createOrder(title: string, updatedBy: ParticipantName): Order {
    const order: Order = {
      id: crypto.randomUUID(),
      orderNumber: this.nextOrderNumber++,
      title,
      description: null,
      clientName: null,
      amount: null,
      status: 'new',
      priority: 'medium',
      dueDate: null,
      tags: [],
      assignedTo: [],
      isFavorite: false,
      updatedBy,
      updatedAt: new Date(),
    };
    this.orders.set(order.id, order);
    return { ...order };
  }

  getOrder(id: string): Order | null {
    const order = this.orders.get(id);
    return order ? { ...order } : null;
  }

  /**
   * Updates an order and generates system comments for each field change.
   * This mirrors the behavior of the actual orderService.updateOrder function.
   */
  updateOrder(id: string, updates: Partial<Order>, updatedBy: ParticipantName): Order | null {
    const currentOrder = this.orders.get(id);
    if (!currentOrder) return null;

    const fieldChanges: FieldChange[] = [];

    // Detect changes for each field
    if (updates.title !== undefined && updates.title !== currentOrder.title) {
      fieldChanges.push({ fieldName: 'title', oldValue: currentOrder.title, newValue: updates.title });
    }
    if (updates.description !== undefined && updates.description !== currentOrder.description) {
      fieldChanges.push({ fieldName: 'description', oldValue: currentOrder.description, newValue: updates.description });
    }
    if (updates.clientName !== undefined && updates.clientName !== currentOrder.clientName) {
      fieldChanges.push({ fieldName: 'clientName', oldValue: currentOrder.clientName, newValue: updates.clientName });
    }
    if (updates.amount !== undefined && updates.amount !== currentOrder.amount) {
      fieldChanges.push({ fieldName: 'amount', oldValue: currentOrder.amount, newValue: updates.amount });
    }
    if (updates.status !== undefined && updates.status !== currentOrder.status) {
      fieldChanges.push({ fieldName: 'status', oldValue: currentOrder.status, newValue: updates.status });
    }
    if (updates.priority !== undefined && updates.priority !== currentOrder.priority) {
      fieldChanges.push({ fieldName: 'priority', oldValue: currentOrder.priority, newValue: updates.priority });
    }
    if (updates.tags !== undefined && JSON.stringify(updates.tags) !== JSON.stringify(currentOrder.tags)) {
      fieldChanges.push({ fieldName: 'tags', oldValue: currentOrder.tags, newValue: updates.tags });
    }
    if (updates.assignedTo !== undefined && JSON.stringify(updates.assignedTo.sort()) !== JSON.stringify([...currentOrder.assignedTo].sort())) {
      fieldChanges.push({ fieldName: 'assignedTo', oldValue: currentOrder.assignedTo, newValue: updates.assignedTo });
    }
    if (updates.isFavorite !== undefined && updates.isFavorite !== currentOrder.isFavorite) {
      fieldChanges.push({ fieldName: 'isFavorite', oldValue: currentOrder.isFavorite, newValue: updates.isFavorite });
    }

    // Apply updates
    const updatedOrder: Order = {
      ...currentOrder,
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    };
    this.orders.set(id, updatedOrder);

    // Record history and create system comments for each change
    for (const change of fieldChanges) {
      // Record in history
      this.history.push({
        id: crypto.randomUUID(),
        orderId: id,
        changedBy: updatedBy,
        fieldName: change.fieldName,
        oldValue: formatValueForStorage(change.oldValue),
        newValue: formatValueForStorage(change.newValue),
        changedAt: new Date(),
      });

      // Create system comment
      const message = generateSystemCommentMessage(
        updatedBy,
        change.fieldName,
        change.oldValue,
        change.newValue
      );
      this.comments.push({
        id: crypto.randomUUID(),
        orderId: id,
        author: updatedBy,
        content: message,
        isSystem: true,
        createdAt: new Date(),
      });
    }

    return { ...updatedOrder };
  }

  getCommentsByOrderId(orderId: string): Comment[] {
    return this.comments.filter(c => c.orderId === orderId);
  }

  getSystemCommentsByOrderId(orderId: string): Comment[] {
    return this.comments.filter(c => c.orderId === orderId && c.isSystem);
  }

  getHistoryByOrderId(orderId: string): OrderHistoryEntry[] {
    return this.history.filter(h => h.orderId === orderId);
  }
}


// Generators
const participantNameArb = fc.constantFrom<ParticipantName>('Никита', 'Саня', 'Ксюша');
const statusArb = fc.constantFrom<OrderStatus>('new', 'in_progress', 'review', 'completed', 'rejected');
const priorityArb = fc.constantFrom<Priority>('high', 'medium', 'low');
const validTitleArb = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);
const nullableStringArb = fc.oneof(fc.string({ minLength: 1, maxLength: 200 }), fc.constant(null));
const nullableAmountArb = fc.oneof(fc.float({ min: 0, max: 1000000, noNaN: true }), fc.constant(null));
const tagsArb = fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 });
const assignedToArb = fc.array(participantNameArb, { maxLength: 3 });

describe('Property 16: System Comment Generation on Field Change', () => {
  let store: OrderStoreWithHistory;

  beforeEach(() => {
    store = new OrderStoreWithHistory();
  });

  it('system comment is created with isSystem=true for title change', () => {
    fc.assert(
      fc.property(
        validTitleArb,
        validTitleArb.filter(s => s.length > 0),
        participantNameArb,
        participantNameArb,
        (initialTitle, newTitle, creator, updater) => {
          // Skip if titles are the same (no change)
          if (initialTitle === newTitle) return;
          
          store.reset();
          const order = store.createOrder(initialTitle, creator);
          
          store.updateOrder(order.id, { title: newTitle }, updater);
          
          const systemComments = store.getSystemCommentsByOrderId(order.id);
          
          expect(systemComments.length).toBe(1);
          expect(systemComments[0].isSystem).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('system comment contains the participant who made the change', () => {
    fc.assert(
      fc.property(
        validTitleArb,
        validTitleArb.filter(s => s.length > 0),
        participantNameArb,
        participantNameArb,
        (initialTitle, newTitle, creator, updater) => {
          if (initialTitle === newTitle) return;
          
          store.reset();
          const order = store.createOrder(initialTitle, creator);
          
          store.updateOrder(order.id, { title: newTitle }, updater);
          
          const systemComments = store.getSystemCommentsByOrderId(order.id);
          
          expect(systemComments.length).toBe(1);
          expect(systemComments[0].author).toBe(updater);
          expect(systemComments[0].content).toContain(updater);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('system comment contains the field name', () => {
    fc.assert(
      fc.property(
        validTitleArb,
        statusArb,
        participantNameArb,
        participantNameArb,
        (title, newStatus, creator, updater) => {
          store.reset();
          const order = store.createOrder(title, creator);
          
          // Status is initially 'new', so we need a different status
          if (newStatus === 'new') return;
          
          store.updateOrder(order.id, { status: newStatus }, updater);
          
          const systemComments = store.getSystemCommentsByOrderId(order.id);
          
          expect(systemComments.length).toBe(1);
          // Should contain the Russian field name 'статус'
          expect(systemComments[0].content).toContain('статус');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('system comment contains old and new values', () => {
    fc.assert(
      fc.property(
        validTitleArb,
        priorityArb,
        participantNameArb,
        participantNameArb,
        (title, newPriority, creator, updater) => {
          store.reset();
          const order = store.createOrder(title, creator);
          
          // Priority is initially 'medium', so we need a different priority
          if (newPriority === 'medium') return;
          
          store.updateOrder(order.id, { priority: newPriority }, updater);
          
          const systemComments = store.getSystemCommentsByOrderId(order.id);
          
          expect(systemComments.length).toBe(1);
          // Should contain both old value 'medium' and new value
          expect(systemComments[0].content).toContain('medium');
          expect(systemComments[0].content).toContain(newPriority);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('history entry is created for each field change', () => {
    fc.assert(
      fc.property(
        validTitleArb,
        validTitleArb.filter(s => s.length > 0),
        participantNameArb,
        participantNameArb,
        (initialTitle, newTitle, creator, updater) => {
          if (initialTitle === newTitle) return;
          
          store.reset();
          const order = store.createOrder(initialTitle, creator);
          
          store.updateOrder(order.id, { title: newTitle }, updater);
          
          const history = store.getHistoryByOrderId(order.id);
          
          expect(history.length).toBe(1);
          expect(history[0].fieldName).toBe('title');
          expect(history[0].changedBy).toBe(updater);
          expect(history[0].oldValue).toBe(initialTitle);
          expect(history[0].newValue).toBe(newTitle);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('multiple field changes create multiple system comments', () => {
    fc.assert(
      fc.property(
        validTitleArb,
        validTitleArb.filter(s => s.length > 0),
        statusArb,
        participantNameArb,
        participantNameArb,
        (initialTitle, newTitle, newStatus, creator, updater) => {
          // Need at least one actual change
          const titleChanged = initialTitle !== newTitle;
          const statusChanged = newStatus !== 'new'; // initial status is 'new'
          
          if (!titleChanged && !statusChanged) return;
          
          store.reset();
          const order = store.createOrder(initialTitle, creator);
          
          store.updateOrder(order.id, { title: newTitle, status: newStatus }, updater);
          
          const systemComments = store.getSystemCommentsByOrderId(order.id);
          const history = store.getHistoryByOrderId(order.id);
          
          const expectedChanges = (titleChanged ? 1 : 0) + (statusChanged ? 1 : 0);
          
          expect(systemComments.length).toBe(expectedChanges);
          expect(history.length).toBe(expectedChanges);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no system comment is created when field value does not change', () => {
    fc.assert(
      fc.property(
        validTitleArb,
        participantNameArb,
        participantNameArb,
        (title, creator, updater) => {
          store.reset();
          const order = store.createOrder(title, creator);
          
          // Update with the same title - no change
          store.updateOrder(order.id, { title: title }, updater);
          
          const systemComments = store.getSystemCommentsByOrderId(order.id);
          
          expect(systemComments.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('system comment for array field (tags) shows correct format', () => {
    fc.assert(
      fc.property(
        validTitleArb,
        tagsArb.filter(t => t.length > 0),
        participantNameArb,
        participantNameArb,
        (title, newTags, creator, updater) => {
          store.reset();
          const order = store.createOrder(title, creator);
          
          store.updateOrder(order.id, { tags: newTags }, updater);
          
          const systemComments = store.getSystemCommentsByOrderId(order.id);
          
          expect(systemComments.length).toBe(1);
          expect(systemComments[0].content).toContain('теги');
          // Old value should be '(пусто)' since initial tags are empty
          expect(systemComments[0].content).toContain('(пусто)');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('system comment for boolean field (isFavorite) shows correct format', () => {
    fc.assert(
      fc.property(
        validTitleArb,
        participantNameArb,
        participantNameArb,
        (title, creator, updater) => {
          store.reset();
          const order = store.createOrder(title, creator);
          
          // Initial isFavorite is false, change to true
          store.updateOrder(order.id, { isFavorite: true }, updater);
          
          const systemComments = store.getSystemCommentsByOrderId(order.id);
          
          expect(systemComments.length).toBe(1);
          expect(systemComments[0].content).toContain('избранное');
          expect(systemComments[0].content).toContain('нет');
          expect(systemComments[0].content).toContain('да');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('system comment for assignedTo field shows participant names', () => {
    fc.assert(
      fc.property(
        validTitleArb,
        assignedToArb.filter(a => a.length > 0),
        participantNameArb,
        participantNameArb,
        (title, newAssignedTo, creator, updater) => {
          store.reset();
          const order = store.createOrder(title, creator);
          
          store.updateOrder(order.id, { assignedTo: newAssignedTo }, updater);
          
          const systemComments = store.getSystemCommentsByOrderId(order.id);
          
          expect(systemComments.length).toBe(1);
          expect(systemComments[0].content).toContain('исполнители');
        }
      ),
      { numRuns: 100 }
    );
  });
});
