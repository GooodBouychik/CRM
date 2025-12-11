import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { createServer } from 'http';
import { pool } from './db/pool.js';
import { orderRoutes } from './routes/orders.js';
import { attachmentRoutes } from './routes/attachments.js';
import { subtaskRoutes } from './routes/subtasks.js';
import { commentRoutes } from './routes/comments.js';
import { userRoutes } from './routes/users.js';
import { taskRoutes } from './routes/tasks.js';
import { accountRoutes } from './routes/accounts.js';
import { archiveRoutes } from './routes/archive.js';
import { activityRoutes } from './routes/activity.js';
import { clientRoutes } from './routes/clients.js';
import { statisticsRoutes } from './routes/statistics.js';
import { customFieldRoutes } from './routes/customFields.js';
import { calendarRoutes } from './routes/calendar.js';
import { settingsRoutes } from './routes/settings.js';
import { initializeSocketServer, getOnlineUsers, getOrderViewers } from './socket/index.js';
import { initializeTelegramBot } from './services/telegramService.js';
import { initializeNotificationQueue } from './services/notificationQueue.js';
import { startDeadlineReminderScheduler } from './services/deadlineReminderService.js';
import { startDailyDigestScheduler } from './services/dailyDigestService.js';

const fastify = Fastify({
  logger: true,
});

// Create HTTP server for Socket.io integration
const httpServer = createServer(fastify.server);

await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});

// Register multipart for file uploads
await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Serve uploaded files
await fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/uploads/',
});

// Register routes
await fastify.register(orderRoutes);
await fastify.register(attachmentRoutes);
await fastify.register(subtaskRoutes);
await fastify.register(commentRoutes);
await fastify.register(userRoutes);
await fastify.register(taskRoutes);
await fastify.register(accountRoutes);
await fastify.register(archiveRoutes);
await fastify.register(activityRoutes);
await fastify.register(clientRoutes);
await fastify.register(statisticsRoutes);
await fastify.register(customFieldRoutes);
await fastify.register(calendarRoutes);
await fastify.register(settingsRoutes);

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Database health check
fastify.get('/health/db', async () => {
  try {
    const result = pool.query("SELECT datetime('now') as now");
    return { status: 'ok', timestamp: result.rows[0]?.now };
  } catch (error) {
    return { status: 'error', message: 'Database connection failed' };
  }
});

// Presence API endpoints
fastify.get('/api/presence', async () => {
  return getOnlineUsers();
});

fastify.get('/api/presence/order/:orderId', async (request) => {
  const { orderId } = request.params as { orderId: string };
  return getOrderViewers(orderId);
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    
    // Initialize Socket.io server
    const io = initializeSocketServer(fastify.server);
    console.log('Socket.io server initialized');
    
    // Initialize Telegram bot
    const telegramBot = initializeTelegramBot();
    if (telegramBot) {
      console.log('Telegram bot initialized');
    } else {
      console.log('Telegram bot not configured (TELEGRAM_BOT_TOKEN not set)');
    }
    
    // Initialize notification queue (requires Redis)
    const notificationQueueResult = initializeNotificationQueue();
    if (notificationQueueResult) {
      console.log('Notification queue initialized');
      
      // Start deadline reminder scheduler (Requirements 8.4)
      // Check every 24 hours for orders with deadlines ≤3 days
      startDeadlineReminderScheduler(24);
      
      // Start daily digest scheduler (Requirements 8.8)
      // Checks every 5 minutes if any user should receive their digest
      startDailyDigestScheduler();
    } else {
      console.log('Notification queue not initialized (Redis may not be available)');
    }
    
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on port ${port}`);
    console.log(`WebSocket server ready on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
