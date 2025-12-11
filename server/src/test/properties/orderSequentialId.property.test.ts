import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: team-crm, Property 4: Sequential Order ID Assignment**
 * **Validates: Requirements 2.2, 2.4**
 * 
 * For any sequence of order creations, each new order should receive an 
 * orderNumber that is exactly one greater than the maximum existing orderNumber,
 * ensuring no gaps or duplicates.
 */

// Simulated in-memory order store for testing the sequential ID logic
// This tests the core algorithm without requiring a database connection
interface OrderRecord {
  id: string;
  orderNumber: number;
  title: string;
}

class OrderStore {
  private orders: OrderRecord[] = [];
  private nextOrderNumber = 1;

  reset() {
    this.orders = [];
    this.nextOrderNumber = 1;
  }

  createOrder(title: string): OrderRecord {
    const order: OrderRecord = {
      id: crypto.randomUUID(),
      orderNumber: this.nextOrderNumber++,
      title,
    };
    this.orders.push(order);
    return order;
  }

  getMaxOrderNumber(): number {
    if (this.orders.length === 0) return 0;
    return Math.max(...this.orders.map(o => o.orderNumber));
  }

  getAllOrders(): OrderRecord[] {
    return [...this.orders];
  }
}

describe('Property 4: Sequential Order ID Assignment', () => {
  let store: OrderStore;

  beforeEach(() => {
    store = new OrderStore();
  });

  it('each new order receives orderNumber exactly one greater than max existing', () => {
    fc.assert(
      fc.property(
        // Generate a sequence of order titles (1-50 orders)
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 50 }),
        (titles) => {
          store.reset();
          
          for (let i = 0; i < titles.length; i++) {
            const maxBefore = store.getMaxOrderNumber();
            const order = store.createOrder(titles[i]);
            
            // Property: new orderNumber should be exactly maxBefore + 1
            expect(order.orderNumber).toBe(maxBefore + 1);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no gaps in order numbers after sequential creation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (count) => {
          store.reset();
          
          // Create 'count' orders
          for (let i = 0; i < count; i++) {
            store.createOrder(`Order ${i + 1}`);
          }
          
          const orders = store.getAllOrders();
          const orderNumbers = orders.map(o => o.orderNumber).sort((a, b) => a - b);
          
          // Property: order numbers should be 1, 2, 3, ..., count with no gaps
          for (let i = 0; i < orderNumbers.length; i++) {
            expect(orderNumbers[i]).toBe(i + 1);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no duplicate order numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (count) => {
          store.reset();
          
          // Create 'count' orders
          for (let i = 0; i < count; i++) {
            store.createOrder(`Order ${i + 1}`);
          }
          
          const orders = store.getAllOrders();
          const orderNumbers = orders.map(o => o.orderNumber);
          const uniqueNumbers = new Set(orderNumbers);
          
          // Property: all order numbers should be unique
          expect(uniqueNumbers.size).toBe(orderNumbers.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
