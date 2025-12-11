// PM2 конфиг для запуска приложения
// Установить PM2: npm install -g pm2
// Запуск: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'team-crm-frontend',
      cwd: '/var/www/team-crm/team-crm',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'team-crm-backend',
      cwd: '/var/www/team-crm/team-crm/server',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        CORS_ORIGIN: 'https://daktntg.site',
        APP_URL: 'https://daktntg.site',
      },
    },
  ],
};
