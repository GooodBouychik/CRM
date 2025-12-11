'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { PeriodFilter, RevenueChart, TeamWorkloadChart, type PeriodFilterValue } from '@/components/statistics';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  fetchRevenueByMonth,
  fetchTeamWorkload,
  fetchStatisticsOverview,
  type MonthlyRevenue,
  type TeamMemberWorkload,
  type StatisticsOverview,
} from '@/lib/api';

// Get default period (last 12 months)
function getDefaultPeriod(): PeriodFilterValue {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 11);
  from.setDate(1);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

export default function StatisticsPage() {
  const [period, setPeriod] = useState<PeriodFilterValue>(getDefaultPeriod);
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
  const [workloadData, setWorkloadData] = useState<TeamMemberWorkload[]>([]);
  const [overview, setOverview] = useState<StatisticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all statistics data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [revenue, workload, overviewData] = await Promise.all([
        fetchRevenueByMonth(period.from, period.to),
        fetchTeamWorkload(),
        fetchStatisticsOverview(),
      ]);
      setRevenueData(revenue);
      setWorkloadData(workload);
      setOverview(overviewData);
    } catch (err) {
      setError('Не удалось загрузить статистику');
      console.error('Failed to fetch statistics:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Load data on mount and when period changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle period change
  const handlePeriodChange = useCallback((newPeriod: PeriodFilterValue) => {
    setPeriod(newPeriod);
  }, []);

  return (
    <AppLayout
      title="Статистика"
      subtitle="Аналитика и показатели бизнеса"
    >
      <div className="p-6 overflow-auto h-full">
        {/* Period filter */}
        <div className="mb-6">
          <PeriodFilter value={period} onChange={handlePeriodChange} />
        </div>

        {/* Overview stats */}
        {overview && !loading && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-surface-50 border border-surface-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span>📋</span>
                <span className="text-xs text-gray-500">Всего заказов</span>
              </div>
              <p className="text-2xl font-bold text-gray-100">{overview.totalOrders}</p>
            </div>
            <div className="bg-surface-50 border border-surface-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span>⚡</span>
                <span className="text-xs text-gray-500">Активных</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{overview.activeOrders}</p>
            </div>
            <div className="bg-surface-50 border border-surface-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span>✅</span>
                <span className="text-xs text-gray-500">Завершённых</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{overview.completedOrders}</p>
            </div>
            <div className="bg-surface-50 border border-surface-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span>🆕</span>
                <span className="text-xs text-gray-500">Новых</span>
              </div>
              <p className="text-2xl font-bold text-amber-400">{overview.statusDistribution.new}</p>
            </div>
            <div className="bg-surface-50 border border-surface-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span>🔍</span>
                <span className="text-xs text-gray-500">На проверке</span>
              </div>
              <p className="text-2xl font-bold text-violet-400">{overview.statusDistribution.review}</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {/* Charts grid */}
        {!error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart data={revenueData} loading={loading} />
            <TeamWorkloadChart data={workloadData} loading={loading} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
