import { create } from 'zustand';
import type { Order } from '@/types';

interface OrderState {
  orders: Record<string, Order>;
  selectedOrderId: string | null;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, data: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  selectOrder: (id: string | null) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: {},
  selectedOrderId: null,
  setOrders: (orders) =>
    set({
      orders: orders.reduce((acc, order) => ({ ...acc, [order.id]: order }), {}),
    }),
  addOrder: (order) =>
    set((state) => ({
      orders: { ...state.orders, [order.id]: order },
    })),
  updateOrder: (id, data) =>
    set((state) => ({
      orders: {
        ...state.orders,
        [id]: { ...state.orders[id], ...data },
      },
    })),
  deleteOrder: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.orders;
      return { orders: rest };
    }),
  selectOrder: (id) => set({ selectedOrderId: id }),
}));
