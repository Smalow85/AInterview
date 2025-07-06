# Этап 1: Сборка фронтенда
FROM node:18-alpine AS frontend-builder
ARG REACT_APP_GEMINI_API_KEY
ENV REACT_APP_GEMINI_API_KEY=$REACT_APP_GEMINI_API_KEY
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Этап 2: Подготовка бэкенда
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./

# Этап 3: Финальный образ
FROM node:18-alpine
WORKDIR /app

# Копируем фронтенд
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Копируем бэкенд и node_modules
COPY --from=backend-builder /app/backend ./backend
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Копируем proxy-сервер и package.json для proxy
COPY proxy-server.js ./
COPY package.json ./

# Устанавливаем зависимости для proxy-сервера
RUN npm install

# Открываем порт
EXPOSE 8080

# Запускаем proxy-сервер
CMD ["node", "proxy-server.js"]