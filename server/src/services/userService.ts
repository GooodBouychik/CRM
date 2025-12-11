import { query, queryOne, run } from '../db/pool.js';
import type { ParticipantName, User, UserPreferences } from '../types.js';

const DEFAULT_PREFERENCES: UserPreferences = {
  notifications: {
    newOrder: true,
    comments: true,
    statusChanges: true,
    mentions: true,
    deadlineReminders: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  dailyDigest: {
    enabled: false,
    time: '09:00',
  },
};

function mapUser(row: any): User {
  const preferences = row.preferences ? JSON.parse(row.preferences) : {};
  return {
    id: row.id,
    name: row.name,
    avatarColor: row.avatar_color,
    telegramId: row.telegram_id,
    telegramUsername: row.telegram_username,
    email: row.email,
    preferences: { ...DEFAULT_PREFERENCES, ...preferences },
    lastSeen: row.last_seen,
  };
}

export async function getUserByName(name: ParticipantName): Promise<User | null> {
  const row = queryOne<any>(`SELECT * FROM users WHERE name = ?`, [name]);
  return row ? mapUser(row) : null;
}

export async function getAllUsers(): Promise<User[]> {
  const rows = query<any>(`SELECT * FROM users ORDER BY name`);
  return rows.map(mapUser);
}

export interface UpdatePreferencesInput {
  notifications?: Partial<UserPreferences['notifications']>;
  quietHours?: Partial<UserPreferences['quietHours']>;
  dailyDigest?: Partial<UserPreferences['dailyDigest']>;
}

export async function updateUserPreferences(
  name: ParticipantName,
  preferences: UpdatePreferencesInput
): Promise<User | null> {
  const currentUser = await getUserByName(name);
  if (!currentUser) return null;
  
  const mergedPreferences: UserPreferences = {
    notifications: {
      ...currentUser.preferences.notifications,
      ...preferences.notifications,
    },
    quietHours: {
      ...currentUser.preferences.quietHours,
      ...preferences.quietHours,
    },
    dailyDigest: {
      ...currentUser.preferences.dailyDigest,
      ...preferences.dailyDigest,
    },
  };
  
  run(
    `UPDATE users SET preferences = ? WHERE name = ?`,
    [JSON.stringify(mergedPreferences), name]
  );
  
  return getUserByName(name);
}

export async function isNotificationEnabled(
  name: ParticipantName,
  notificationType: keyof UserPreferences['notifications']
): Promise<boolean> {
  const user = await getUserByName(name);
  if (!user) return true;
  return user.preferences.notifications[notificationType] ?? true;
}

export async function getQuietHoursSettings(
  name: ParticipantName
): Promise<UserPreferences['quietHours'] | null> {
  const user = await getUserByName(name);
  if (!user) return null;
  return user.preferences.quietHours;
}

export async function getDailyDigestSettings(
  name: ParticipantName
): Promise<UserPreferences['dailyDigest'] | null> {
  const user = await getUserByName(name);
  if (!user) return null;
  return user.preferences.dailyDigest;
}
