import TelegramBot from 'node-telegram-bot-api';
import { pool } from '../db/pool.js';
import type { ParticipantName } from '../types.js';

// Telegram bot instance (initialized lazily)
let bot: TelegramBot | null = null;

/**
 * Initialize the Telegram bot with polling mode
 * Call this once at server startup
 */
export function initializeTelegramBot(): TelegramBot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN not set - Telegram notifications disabled');
    return null;
  }
  
  try {
    bot = new TelegramBot(token, { polling: true });
    
    // Handle /start command - link user's Telegram account
    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramUsername = msg.from?.username || null;
      
      await bot?.sendMessage(
        chatId,
        'Привет! 👋\n\n' +
        'Я бот Team CRM для уведомлений о заказах.\n\n' +
        'Чтобы привязать ваш аккаунт, отправьте команду:\n' +
        '/link <ваше_имя>\n\n' +
        'Например: /link Никита'
      );
    });
    
    // Handle /link command - associate Telegram ID with user
    bot.onText(/\/link (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id;
      const telegramUsername = msg.from?.username || null;
      const userName = match?.[1]?.trim();
      
      if (!userName || !telegramId) {
        await bot?.sendMessage(chatId, '❌ Укажите ваше имя: /link <имя>');
        return;
      }
      
      try {
        const result = await linkTelegramAccount(userName as ParticipantName, telegramId, telegramUsername);
        
        if (result.success) {
          await bot?.sendMessage(
            chatId,
            `✅ Аккаунт успешно привязан!\n\n` +
            `Имя: ${userName}\n` +
            `Telegram ID: ${telegramId}\n\n` +
            `Теперь вы будете получать уведомления о:\n` +
            `• Новых заказах\n` +
            `• Комментариях\n` +
            `• Изменениях статуса\n` +
            `• Упоминаниях (@${userName})\n` +
            `• Приближающихся дедлайнах`
          );
        } else {
          await bot?.sendMessage(chatId, `❌ ${result.error}`);
        }
      } catch (error) {
        console.error('Error linking Telegram account:', error);
        await bot?.sendMessage(chatId, '❌ Произошла ошибка при привязке аккаунта');
      }
    });

    // Handle /status command - check link status
    bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id;
      
      try {
        const result = await pool.query(
          'SELECT name FROM users WHERE telegram_id = $1',
          [telegramId]
        );
        
        if (result.rows.length > 0) {
          await bot?.sendMessage(
            chatId,
            `✅ Ваш аккаунт привязан к: ${result.rows[0].name}`
          );
        } else {
          await bot?.sendMessage(
            chatId,
            '❌ Ваш Telegram не привязан к аккаунту CRM.\n' +
            'Используйте /link <имя> для привязки.'
          );
        }
      } catch (error) {
        console.error('Error checking status:', error);
        await bot?.sendMessage(chatId, '❌ Ошибка при проверке статуса');
      }
    });
    
    // Handle /help command
    bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      await bot?.sendMessage(
        chatId,
        '📚 Команды бота:\n\n' +
        '/start - Начать работу с ботом\n' +
        '/link <имя> - Привязать Telegram к аккаунту CRM\n' +
        '/status - Проверить статус привязки\n' +
        '/help - Показать эту справку'
      );
    });
    
    console.log('Telegram bot initialized successfully');
    return bot;
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
    return null;
  }
}

/**
 * Get the Telegram bot instance
 */
export function getTelegramBot(): TelegramBot | null {
  return bot;
}

/**
 * Link a Telegram account to a CRM user
 */
export async function linkTelegramAccount(
  userName: ParticipantName,
  telegramId: number,
  telegramUsername: string | null
): Promise<{ success: boolean; error?: string }> {
  const validNames: ParticipantName[] = ['Никита', 'Саня', 'Ксюша'];
  
  if (!validNames.includes(userName)) {
    return { 
      success: false, 
      error: `Пользователь "${userName}" не найден. Доступные имена: ${validNames.join(', ')}` 
    };
  }
  
  try {
    // Check if this Telegram ID is already linked to another user
    const existingLink = await pool.query(
      'SELECT name FROM users WHERE telegram_id = $1 AND name != $2',
      [telegramId, userName]
    );
    
    if (existingLink.rows.length > 0) {
      return {
        success: false,
        error: `Этот Telegram уже привязан к пользователю: ${existingLink.rows[0].name}`
      };
    }
    
    // Update user with Telegram info
    await pool.query(
      `UPDATE users 
       SET telegram_id = $1, telegram_username = $2 
       WHERE name = $3`,
      [telegramId, telegramUsername, userName]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error linking Telegram account:', error);
    return { success: false, error: 'Ошибка базы данных' };
  }
}

/**
 * Get Telegram chat ID for a user by name
 */
export async function getTelegramChatId(userName: ParticipantName): Promise<number | null> {
  try {
    const result = await pool.query(
      'SELECT telegram_id FROM users WHERE name = $1',
      [userName]
    );
    return result.rows[0]?.telegram_id || null;
  } catch (error) {
    console.error('Error getting Telegram chat ID:', error);
    return null;
  }
}

/**
 * Get all users with linked Telegram accounts
 */
export async function getAllTelegramUsers(): Promise<Array<{ name: ParticipantName; telegramId: number }>> {
  try {
    const result = await pool.query(
      'SELECT name, telegram_id FROM users WHERE telegram_id IS NOT NULL'
    );
    return result.rows.map(row => ({
      name: row.name as ParticipantName,
      telegramId: row.telegram_id
    }));
  } catch (error) {
    console.error('Error getting Telegram users:', error);
    return [];
  }
}


/**
 * Send a message to a specific user via Telegram
 */
export async function sendTelegramMessage(
  userName: ParticipantName,
  message: string,
  options?: { parseMode?: 'HTML' | 'Markdown' }
): Promise<boolean> {
  if (!bot) {
    console.warn('Telegram bot not initialized');
    return false;
  }
  
  const chatId = await getTelegramChatId(userName);
  if (!chatId) {
    console.warn(`No Telegram ID for user: ${userName}`);
    return false;
  }
  
  try {
    await bot.sendMessage(chatId, message, {
      parse_mode: options?.parseMode || 'HTML',
      disable_web_page_preview: true
    });
    return true;
  } catch (error) {
    console.error(`Failed to send Telegram message to ${userName}:`, error);
    return false;
  }
}

/**
 * Send a message to multiple users
 */
export async function broadcastTelegramMessage(
  userNames: ParticipantName[],
  message: string,
  options?: { parseMode?: 'HTML' | 'Markdown'; excludeUser?: ParticipantName }
): Promise<void> {
  const recipients = options?.excludeUser 
    ? userNames.filter(name => name !== options.excludeUser)
    : userNames;
  
  await Promise.all(
    recipients.map(userName => sendTelegramMessage(userName, message, options))
  );
}

/**
 * Send a message to all users with linked Telegram accounts
 */
export async function sendToAllUsers(
  message: string,
  options?: { parseMode?: 'HTML' | 'Markdown'; excludeUser?: ParticipantName }
): Promise<void> {
  const users = await getAllTelegramUsers();
  const recipients = options?.excludeUser
    ? users.filter(u => u.name !== options.excludeUser)
    : users;
  
  await Promise.all(
    recipients.map(user => 
      bot?.sendMessage(user.telegramId, message, {
        parse_mode: options?.parseMode || 'HTML',
        disable_web_page_preview: true
      }).catch(err => console.error(`Failed to send to ${user.name}:`, err))
    )
  );
}

/**
 * Check if user has quiet hours enabled and if current time is within quiet hours
 */
export async function isInQuietHours(userName: ParticipantName): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT preferences FROM users WHERE name = $1',
      [userName]
    );
    
    const preferences = result.rows[0]?.preferences;
    if (!preferences?.quietHours?.enabled) {
      return false;
    }
    
    const { start, end } = preferences.quietHours;
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }
    
    return currentTime >= start && currentTime < end;
  } catch (error) {
    console.error('Error checking quiet hours:', error);
    return false;
  }
}

/**
 * Record a notification in the database
 */
export async function recordNotification(
  userId: string,
  notificationType: string,
  payload: Record<string, unknown>,
  status: 'pending' | 'sent' | 'failed' = 'pending'
): Promise<string> {
  const result = await pool.query(
    `INSERT INTO telegram_notifications (user_id, notification_type, payload, status, sent_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, notificationType, JSON.stringify(payload), status, status === 'sent' ? new Date() : null]
  );
  return result.rows[0].id;
}
