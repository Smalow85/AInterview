# Project with React frontend and Spring Boot backend

### Структура проекта

```bash
/project-root

/backend — Spring Boot приложение

/frontend — React приложение
```

## Локальная разработка

### Запуск backend

Перейди в папку backend и запусти Spring Boot:

```bash
cd backend
./mvnw spring-boot:run
```

Приложение будет доступно на http://localhost:8080.

Запуск frontend
Перейди в папку frontend и запусти React dev server:

```bash
cd frontend
npm install
npm start
```
React будет доступен на http://localhost:3000.

### Проксирование API

Для удобства в frontend/package.json прописан прокси:

```bash
"proxy": "http://localhost:8080"
```
Это позволяет отправлять запросы к API без проблем с CORS, просто обращаясь к относительным путям (например, /api/chat/ask).

# Сборка frontend для продакшена
Чтобы собрать фронт и получить готовые файлы:

```bash
cd frontend
npm run build
```

Это создаст папку frontend/build с готовым сайтом.

Интеграция frontend в backend
После сборки фронта нужно скопировать содержимое frontend/build в папку ресурсов Spring Boot:

```bash
cp -r frontend/build/* backend/src/main/resources/static/
```

Spring Boot теперь будет отдавать фронтенд из своей папки статических ресурсов.

## Запуск продакшен-сборки
Собрать фронт (см. выше).

Запустить Spring Boot приложение из backend (например, через ./mvnw spring-boot:run или из IDE).

Открыть в браузере http://localhost:8080 — там будет работать твой React фронт и API.


