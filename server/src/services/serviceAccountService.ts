import { query, queryOne, run, uuid } from '../db/pool.js';
import type { 
  ServiceAccount, 
  CreateServiceAccountInput, 
  UpdateServiceAccountInput,
  AccountCategory,
  AccountSearchInput
} from '../schemas/serviceAccount.schema.js';

export type { ServiceAccount, CreateServiceAccountInput, UpdateServiceAccountInput, AccountCategory };

interface AccountWithCategory extends ServiceAccount {
  category: AccountCategory | null;
}

function mapAccount(row: any): ServiceAccount {
  return {
    id: row.id,
    serviceName: row.service_name,
    serviceUrl: row.service_url,
    username: row.username,
    password: row.password,
    notes: row.notes,
    categoryId: row.category_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAccountWithCategory(row: any): AccountWithCategory {
  const account = mapAccount(row) as AccountWithCategory;
  if (row.cat_id) {
    account.category = {
      id: row.cat_id,
      name: row.cat_name,
      icon: row.cat_icon,
      color: row.cat_color,
      createdAt: row.cat_created_at,
    };
  } else {
    account.category = null;
  }
  return account;
}

export async function createAccount(input: CreateServiceAccountInput): Promise<ServiceAccount> {
  const id = uuid();
  run(
    `INSERT INTO service_accounts (id, service_name, service_url, username, password, notes, category_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.serviceName,
      input.serviceUrl ?? null,
      input.username,
      input.password,
      input.notes ?? null,
      input.categoryId ?? null,
      input.createdBy,
    ]
  );
  
  return (await getAccountByIdSimple(id))!;
}

async function getAccountByIdSimple(id: string): Promise<ServiceAccount | null> {
  const row = queryOne<any>(`SELECT * FROM service_accounts WHERE id = ?`, [id]);
  return row ? mapAccount(row) : null;
}

export async function getAccountById(id: string): Promise<AccountWithCategory | null> {
  const row = queryOne<any>(
    `SELECT sa.*, 
            ac.id as cat_id, ac.name as cat_name, ac.icon as cat_icon, ac.color as cat_color, ac.created_at as cat_created_at
     FROM service_accounts sa
     LEFT JOIN account_categories ac ON sa.category_id = ac.id
     WHERE sa.id = ?`,
    [id]
  );
  
  return row ? mapAccountWithCategory(row) : null;
}

export async function getAccounts(filter?: AccountSearchInput): Promise<AccountWithCategory[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter?.search) {
    conditions.push(`(sa.service_name LIKE ? OR sa.notes LIKE ?)`);
    const searchPattern = `%${filter.search}%`;
    params.push(searchPattern, searchPattern);
  }
  if (filter?.categoryId) {
    conditions.push(`sa.category_id = ?`);
    params.push(filter.categoryId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = query<any>(
    `SELECT sa.*, 
            ac.id as cat_id, ac.name as cat_name, ac.icon as cat_icon, ac.color as cat_color, ac.created_at as cat_created_at
     FROM service_accounts sa
     LEFT JOIN account_categories ac ON sa.category_id = ac.id
     ${whereClause}
     ORDER BY ac.name, sa.service_name ASC`,
    params
  );
  
  return rows.map(mapAccountWithCategory);
}

export async function getAccountsGroupedByCategory(): Promise<Map<string, AccountWithCategory[]>> {
  const accounts = await getAccounts();
  const grouped = new Map<string, AccountWithCategory[]>();

  for (const account of accounts) {
    const categoryName = account.category?.name ?? 'Other';
    if (!grouped.has(categoryName)) {
      grouped.set(categoryName, []);
    }
    grouped.get(categoryName)!.push(account);
  }

  return grouped;
}

export async function updateAccount(id: string, input: UpdateServiceAccountInput): Promise<ServiceAccount | null> {
  const updates: string[] = [];
  const params: unknown[] = [];

  if (input.serviceName !== undefined) {
    updates.push(`service_name = ?`);
    params.push(input.serviceName);
  }
  if (input.serviceUrl !== undefined) {
    updates.push(`service_url = ?`);
    params.push(input.serviceUrl);
  }
  if (input.username !== undefined) {
    updates.push(`username = ?`);
    params.push(input.username);
  }
  if (input.password !== undefined) {
    updates.push(`password = ?`);
    params.push(input.password);
  }
  if (input.notes !== undefined) {
    updates.push(`notes = ?`);
    params.push(input.notes);
  }
  if (input.categoryId !== undefined) {
    updates.push(`category_id = ?`);
    params.push(input.categoryId);
  }

  updates.push(`updated_at = datetime('now')`);

  if (updates.length === 1) {
    return getAccountByIdSimple(id);
  }

  params.push(id);
  run(`UPDATE service_accounts SET ${updates.join(', ')} WHERE id = ?`, params);
  
  return getAccountByIdSimple(id);
}

export async function deleteAccount(id: string): Promise<boolean> {
  const result = run('DELETE FROM service_accounts WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function searchAccounts(searchQuery: string): Promise<AccountWithCategory[]> {
  return getAccounts({ search: searchQuery });
}
