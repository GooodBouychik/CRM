import { create } from 'zustand';
import type { Order } from '@/types';

function parseOrderDates(order: any): Order {
  return {
    ...order,
    dueDate: order.dueDate ? new Date(order.dueDate) : null,
    createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
    updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
  };
}

interface OrderState {
  orders: Record<string, Order>;
  selectedOrderId: string | null;
  isLoading: boolean;
  error: string | null;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, data: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  selectOrder: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: {},
  selectedOrderId: null,
  isLoading: false,
  error: null,
  setOrders: (orders) =>
    set({
      orders: orders.reduce((acc, order) => ({ ...acc, [order.id]: parseOrderDates(order) }), {}),
      isLoading: false,
    }),
  addOrder: (order) =>
    set((state) => ({
      orders: { ...state.orders, [order.id]: parseOrderDates(order) },
    })),
  updateOrder: (id, data) =>
    set((state) => ({
      orders: {
        ...state.orders,
        [id]: parseOrderDates({ ...state.orders[id], ...data }),
      },
    })),
  deleteOrder: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.orders;
      return { orders: rest };
    }),
  selectOrder: (id) => set({ selectedOrderId: id }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
