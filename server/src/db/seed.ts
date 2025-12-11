import { db, run, uuid } from './pool.js';

async function seed() {
  console.log('Seeding database...');
  
  // Seed initial users (Никита, Саня, Ксюша)
  const users = [
    { name: 'Никита', avatar_color: '#3b82f6' },
    { name: 'Саня', avatar_color: '#10b981' },
    { name: 'Ксюша', avatar_color: '#f59e0b' },
  ];
  
  for (const user of users) {
    const existing = db.prepare('SELECT id FROM users WHERE name = ?').get(user.name);
    if (!existing) {
      run(
        `INSERT INTO users (id, name, avatar_color) VALUES (?, ?, ?)`,
        [uuid(), user.name, user.avatar_color]
      );
      console.log(`Created user: ${user.name}`);
    }
  }
  
  console.log('Seeding complete');
  db.close();
}

seed().catch(console.error);
