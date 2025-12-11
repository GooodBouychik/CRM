# Деплой Team CRM на daktntg.site

## 1. Подготовка сервера

```bash
# Установить Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установить PM2
sudo npm install -g pm2

# Установить nginx (если нет)
sudo apt install -y nginx
```

## 2. Загрузка проекта

```bash
# Создать папку
sudo mkdir -p /var/www/team-crm
sudo chown $USER:$USER /var/www/team-crm

# Скопировать проект (с локальной машины)
# scp -r ./team-crm user@server:/var/www/team-crm/

# Или через git
cd /var/www/team-crm
git clone <repo-url> .
```

## 3. Сборка

```bash
cd /var/www/team-crm/team-crm

# Frontend
npm install
npm run build

# Backend
cd server
npm install
npm run build
```

## 4. Настройка .env

```bash
cd /var/www/team-crm/team-crm/server
cp .env.example .env
nano .env
```

Изменить:
```
CORS_ORIGIN=https://daktntg.site
APP_URL=https://daktntg.site
TELEGRAM_BOT_TOKEN=<твой_токен>
```

## 5. Настройка Nginx

```bash
# Скопировать конфиг из папки nginx проекта
sudo cp /var/www/team-crm/team-crm/nginx/daktntg.site.conf /etc/nginx/sites-available/daktntg.site

# Включить сайт
sudo ln -s /etc/nginx/sites-available/daktntg.site /etc/nginx/sites-enabled/

# Проверить конфиг
sudo nginx -t

# Перезапустить nginx
sudo systemctl reload nginx
```

## 6. SSL сертификат (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d daktntg.site -d www.daktntg.site
```

## 7. Запуск через PM2

```bash
cd /var/www/team-crm/team-crm
pm2 start deploy/ecosystem.config.js

# Автозапуск при перезагрузке
pm2 save
pm2 startup
```

## 8. Полезные команды

```bash
# Статус
pm2 status

# Логи
pm2 logs

# Перезапуск
pm2 restart all

# Остановка
pm2 stop all
```

## DNS настройка

В панели управления доменом добавить A-записи:
- `@` -> IP сервера
- `www` -> IP сервера
