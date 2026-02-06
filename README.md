# Руководство по развертыванию Telegram Mini App

Это руководство описывает, как развернуть Telegram Mini App на сервере Ubuntu с использованием PM2 и файла конфигурации `ecosystem.config.js`. Также объясняется настройка переменных окружения, включая `NODE_ENV` и другие необходимые переменные. Приложение использует базу данных SQLite3.

## Требования

- Сервер Ubuntu (рекомендуется 20.04 или новее)
- Node.js (версия 18 или новее)
- PM2 (`npm install -g pm2`)
- Git
- Nginx или другой обратный прокси (опционально для HTTPS)
- Токен Telegram-бота
- Домен с настроенным HTTPS
- SQLite3 (для базы данных)

## Установка

1. **Клонирование репозитория**

   ```bash
   git clone https://github.com/leisureprog/dead-ddos
   cd dead-ddos
   ```

2. **Установка зависимостей**

   ```bash
   npm install
   ```

3. **Настройка переменных окружения**

   Создайте файл `.env` в корне проекта и настройте следующие переменные:

   ```env
   # Режим окружения (development, production и т.д.)
   NODE_ENV='development'

   # Токен Telegram-бота
   NUXT_TELEGRAM_BOT_TOKEN='ваш-токен-telegram-бота'

   # Базовый URL приложения (должен быть HTTPS)
   NUXT_PUBLIC_BASE_URL='https://domain.com'

   # ID администратора в Telegram
   NUXT_ADMIN_ID='ваш-id-администратора'

   # Адреса кошельков для оплаты
   NUXT_PUBLIC_TON_ADDRESS='ваш-адрес-ton'
   NUXT_PUBLIC_ETHEREUM_ADDRESS='ваш-адрес-ethereum'
   NUXT_PUBLIC_TRON_ADDRESS='ваш-адрес-tron'
   NUXT_PUBLIC_SOLANA_ADDRESS='ваш-адрес-solana'
   NUXT_PUBLIC_BITCOIN_ADDRESS='ваш-адрес-bitcoin'
   ```

   **Объяснение NODE_ENV**:
   - `NODE_ENV='development'`: Используется для локальной разработки с подробным логированием и включённым отладочным режимом. Для продакшена переключите на `production` для оптимизации производительности и уменьшения логов.

4. **Настройка базы данных SQLite3**

   Убедитесь, что файл базы данных SQLite3 (например, `database.sqlite`) находится в соответствующей директории, указанной в конфигурации Prisma (обычно `prisma/database.sqlite`).

   Выполните команду для генерации Prisma Client:

   ```bash
   npx prisma generate
   ```

   Эта команда создаёт необходимые файлы для работы с базой данных на основе схемы Prisma (`prisma/schema.prisma`).

5. **Настройка PM2**

   Создайте файл `ecosystem.config.js` в корне проекта:

   ```javascript
   module.exports = {
     apps: [
       {
         name: 'telegram-mini-app',
         script: 'npm',
         args: 'start',
         env: {
           NODE_ENV: 'production', // Переключение на production для PM2
         },
         instances: 1,
         autorestart: true,
         watch: false,
         max_memory_restart: '1G',
       },
     ],
   };
   ```

6. **Сборка приложения**

   ```bash
   npm run build
   ```

7. **Запуск приложения с PM2**

   ```bash
   pm2 start ecosystem.config.js
   ```

   Сохраните список процессов PM2, чтобы они перезапускались при перезагрузке сервера:

   ```bash
   pm2 save
   ```

   Настройте автозапуск PM2 при старте системы:

   ```bash
   pm2 startup
   ```

8. **Настройка обратного прокси (опционально)**

   Если используется Nginx, настройте его для проксирования запросов к приложению (по умолчанию Nuxt использует порт 3000):

   ```nginx
   server {
       listen 80;
       server_name domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Настройте HTTPS, например, с помощью Certbot для Let's Encrypt.

9. **Тестирование приложения**

   - Убедитесь, что Telegram Mini App доступен по настроенному домену (`https://domain.com`).
   - Проверьте работу бота, взаимодействуя с ним в Telegram.
   - Убедитесь, что база данных SQLite3 работает корректно, выполняя тестовые запросы.

## Описание переменных окружения

- `NUXT_TELEGRAM_BOT_TOKEN`: Токен, полученный от BotFather для вашего Telegram-бота.
- `NUXT_PUBLIC_BASE_URL`: Публичный HTTPS-адрес, где размещено ваше приложение.
- `NUXT_ADMIN_ID`: ID пользователя Telegram для администратора (для ограниченного доступа или уведомлений).
- `NUXT_PUBLIC_*_ADDRESS`: Адреса криптовалютных кошельков для оплаты (TON, Ethereum, Tron, Solana, Bitcoin).

## Устранение неполадок

- **Приложение не запускается**: Проверьте логи PM2 с помощью `pm2 logs telegram-mini-app`.
- **Проблемы с окружением**: Убедитесь, что файл `.env` правильно загружается (`pm2 restart telegram-mini-app --update-env`).
- **Проблемы с базой данных**: Проверьте, существует ли файл `database.sqlite` и правильно ли настроен путь в `prisma/schema.prisma`.
- **Проблемы с HTTPS**: Проверьте SSL-сертификат домена и конфигурацию Nginx.

## Автор

Leisure   
Telegram: [@x_leisure_x](https://t.me/x_leisure_x)
