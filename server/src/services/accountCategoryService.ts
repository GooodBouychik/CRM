import { query, queryOne, run, uuid } from '../db/pool.js';
import type { 
  AccountCategory, 
  CreateAccountCategoryInput 
} from '../schemas/serviceAccount.schema.js';

export type { AccountCategory, CreateAccountCategoryInput };

function mapCategory(row: any): AccountCategory {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    createdAt: row.created_at,
  };
}

export async function createCategory(input: CreateAccountCategoryInput): Promise<AccountCategory> {
  const id = uuid();
  run(
    `INSERT INTO account_categories (id, name, icon, color) VALUES (?, ?, ?, ?)`,
    [id, input.name, input.icon ?? '📁', input.color ?? '#6366f1']
  );
  return (await getCategoryById(id))!;
}

export async function getCategoryById(id: string): Promise<AccountCategory | null> {
  const row = queryOne<any>(`SELECT * FROM account_categories WHERE id = ?`, [id]);
  return row ? mapCategory(row) : null;
}

export async function getCategories(): Promise<AccountCategory[]> {
  const rows = query<any>(`SELECT * FROM account_categories ORDER BY name ASC`);
  return rows.map(mapCategory);
}

export async function updateCategory(id: string, input: Partial<CreateAccountCategoryInput>): Promise<AccountCategory | null> {
  const updates: string[] = [];
  const params: unknown[] = [];

  if (input.name !== undefined) {
    updates.push(`name = ?`);
    params.push(input.name);
  }
  if (input.icon !== undefined) {
    updates.push(`icon = ?`);
    params.push(input.icon);
  }
  if (input.color !== undefined) {
    updates.push(`color = ?`);
    params.push(input.color);
  }

  if (updates.length === 0) return getCategoryById(id);

  params.push(id);
  run(`UPDATE account_categories SET ${updates.join(', ')} WHERE id = ?`, params);
  
  return getCategoryById(id);
}

export async function deleteCategory(id: string): Promise<boolean> {
  const result = run('DELETE FROM account_categories WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function getOrCreateCategory(name: string): Promise<AccountCategory> {
  const existing = queryOne<any>(
    `SELECT * FROM account_categories WHERE LOWER(name) = LOWER(?)`,
    [name]
  );
  
  if (existing) return mapCategory(existing);
  
  return createCategory({ name });
}

export async function seedDefaultCategories(): Promise<void> {
  const defaults = [
    { name: 'Social', icon: '📱', color: '#3b82f6' },
    { name: 'Hosting', icon: '🌐', color: '#10b981' },
    { name: 'Tools', icon: '🔧', color: '#f59e0b' },
    { name: 'Other', icon: '📁', color: '#6366f1' },
  ];

  for (const category of defaults) {
    const existing = queryOne<any>(`SELECT id FROM account_categories WHERE name = ?`, [category.name]);
    if (!existing) {
      run(
        `INSERT INTO account_categories (id, name, icon, color) VALUES (?, ?, ?, ?)`,
        [uuid(), category.name, category.icon, category.color]
      );
    }
  }
}
