import type { SubtaskStatus } from '../../schemas/subtask.schema.js';

/**
 * Maps column IDs to their corresponding subtask statuses.
 * In this system, column IDs are the same as status values.
 */
export const columnToStatus: Record<string, SubtaskStatus> = {
  planning: 'planning',
  development: 'development',
  review: 'review',
  completed: 'completed',
  archived: 'archived',
};

/**
 * Maps subtask statuses to their display column titles.
 */
export const statusToColumnTitle: Record<SubtaskStatus, string> = {
  planning: 'Планирование',
  development: 'Разработка',
  review: 'Проверка',
  completed: 'Завершено',
  archived: 'Архив',
};

/**
 * All valid subtask statuses.
 */
export const SUBTASK_STATUSES: SubtaskStatus[] = [
  'planning',
  'development',
  'review',
  'completed',
  'archived',
];
