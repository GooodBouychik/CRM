import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';

interface EnvSettings {
  TELEGRAM_BOT_TOKEN: string;
  REDIS_HOST: string;
  REDIS_PORT: string;
  APP_URL: string;
}

const ENV_PATH = path.join(process.cwd(), '.env');

function parseEnvFile(): Record<string, string> {
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf-8');
    const result: Record<string, string> = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key) {
          result[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return result;
  } catch {
    return {};
  }
}

function writeEnvFile(settings: Record<string, string>): void {
  // Read existing file to preserve comments and structure
  let content = '';
  try {
    content = fs.readFileSync(ENV_PATH, 'utf-8');
  } catch {
    // File doesn't exist, create new
    content = `# SQLite database path (relative to server folder)
# DB_PATH=./data/crm.db

PORT=3001
CORS_ORIGIN=http://localhost:3000

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=

# Redis Configuration (for Bull queue) - optional
REDIS_HOST=localhost
REDIS_PORT=6379

# Application URL (for links in notifications)
APP_URL=http://localhost:3000
`;
  }

  // Update values in content
  for (const [key, value] of Object.entries(settings)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(ENV_PATH, content, 'utf-8');
}

export async function settingsRoutes(fastify: FastifyInstance) {
  // Get current env settings
  fastify.get('/api/settings/env', async () => {
    const env = parseEnvFile();
    
    // Return only safe settings (mask sensitive values)
    return {
      TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN ? '***configured***' : '',
      TELEGRAM_BOT_TOKEN_SET: !!env.TELEGRAM_BOT_TOKEN,
      REDIS_HOST: env.REDIS_HOST || 'localhost',
      REDIS_PORT: env.REDIS_PORT || '6379',
      APP_URL: env.APP_URL || 'http://localhost:3000',
    };
  });

  // Update env settings
  fastify.put<{ Body: Partial<EnvSettings> }>('/api/settings/env', async (request, reply) => {
    const updates = request.body;
    const currentEnv = parseEnvFile();
    
    // Only update provided values
    const newSettings: Record<string, string> = {};
    
    if (updates.TELEGRAM_BOT_TOKEN !== undefined && updates.TELEGRAM_BOT_TOKEN !== '***configured***') {
      newSettings.TELEGRAM_BOT_TOKEN = updates.TELEGRAM_BOT_TOKEN;
    }
    if (updates.REDIS_HOST !== undefined) {
      newSettings.REDIS_HOST = updates.REDIS_HOST;
    }
    if (updates.REDIS_PORT !== undefined) {
      newSettings.REDIS_PORT = updates.REDIS_PORT;
    }
    if (updates.APP_URL !== undefined) {
      newSettings.APP_URL = updates.APP_URL;
    }

    if (Object.keys(newSettings).length > 0) {
      writeEnvFile(newSettings);
    }

    return { 
      success: true, 
      message: 'Настройки сохранены. Перезапустите сервер для применения изменений.',
      requiresRestart: true
    };
  });

  // Get server status
  fastify.get('/api/settings/status', async () => {
    return {
      telegramConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
      redisConfigured: !!process.env.REDIS_HOST,
      port: process.env.PORT || '3001',
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    };
  });
}
