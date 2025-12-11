import { create } from 'zustand';
import {
  fetchRevenueByMonth,
  fetchTeamWorkload,
  fetchStatisticsOverview,
  type MonthlyRevenue,
  type TeamMemberWorkload,
  type StatisticsOverview,
} from '@/lib/api';

interface PeriodFilter {
  from: string | null;
  to: string | null;
}

interface StatisticsState {
  // Data
  revenueData: MonthlyRevenue[];
  workloadData: TeamMemberWorkload[];
  overview: StatisticsOverview | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  periodFilter: PeriodFilter;
  
  // Actions
  fetchRevenue: (from?: string, to?: string) => Promise<void>;
  fetchWorkload: () => Promise<void>;
  fetchOverview: () => Promise<void>;
  fetchAllStatistics: () => Promise<void>;
  setPeriodFilter: (filter: PeriodFilter) => void;
  clearPeriodFilter: () => void;
}

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  // Initial state
  revenueData: [],
  workloadData: [],
  overview: null,
  loading: false,
  error: null,
  periodFilter: { from: null, to: null },

  fetchRevenue: async (from?: string, to?: string) => {
    set({ loading: true, error: null });
    try {
      const revenueData = await fetchRevenueByMonth(from, to);
      set({ revenueData, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Не удалось загрузить данные о выручке',
        loading: false,
      });
    }
  },


  fetchWorkload: async () => {
    set({ loading: true, error: null });
    try {
      const workloadData = await fetchTeamWorkload();
      set({ workloadData, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Не удалось загрузить данные о загрузке команды',
        loading: false,
      });
    }
  },

  fetchOverview: async () => {
    set({ loading: true, error: null });
    try {
      const overview = await fetchStatisticsOverview();
      set({ overview, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Не удалось загрузить обзор статистики',
        loading: false,
      });
    }
  },

  fetchAllStatistics: async () => {
    const { periodFilter } = get();
    set({ loading: true, error: null });
    try {
      const [revenueData, workloadData, overview] = await Promise.all([
        fetchRevenueByMonth(periodFilter.from ?? undefined, periodFilter.to ?? undefined),
        fetchTeamWorkload(),
        fetchStatisticsOverview(),
      ]);
      set({ revenueData, workloadData, overview, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Не удалось загрузить статистику',
        loading: false,
      });
    }
  },

  setPeriodFilter: (filter: PeriodFilter) => {
    set({ periodFilter: filter });
    // Automatically refetch revenue with new filter
    get().fetchRevenue(filter.from ?? undefined, filter.to ?? undefined);
  },

  clearPeriodFilter: () => {
    set({ periodFilter: { from: null, to: null } });
    get().fetchRevenue();
  },
}));

// Selectors
export const selectTotalRevenue = (state: StatisticsState) =>
  state.revenueData.reduce((sum, month) => sum + month.totalAmount, 0);

export const selectTotalOrders = (state: StatisticsState) =>
  state.revenueData.reduce((sum, month) => sum + month.orderCount, 0);

export const selectAverageMonthlyRevenue = (state: StatisticsState) => {
  if (state.revenueData.length === 0) return 0;
  return selectTotalRevenue(state) / state.revenueData.length;
};

export const selectTotalActiveOrders = (state: StatisticsState) =>
  state.workloadData.reduce((sum, member) => sum + member.activeOrders, 0);

export const selectTotalEstimatedHours = (state: StatisticsState) =>
  state.workloadData.reduce((sum, member) => sum + member.totalEstimatedHours, 0);

export const selectBusiestTeamMember = (state: StatisticsState) => {
  if (state.workloadData.length === 0) return null;
  return state.workloadData.reduce((busiest, member) =>
    member.activeOrders > busiest.activeOrders ? member : busiest
  );
};

export default useStatisticsStore;
