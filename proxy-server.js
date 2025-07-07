const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 8080;

// Запускаем бэкенд в отдельном процессе
const { spawn } = require("child_process");
const backendEntryPoint = process.env.BACKEND_ENTRY || "index.js";

console.log(`Starting backend: ${backendEntryPoint}`);

const backendProcess = spawn("node", [backendEntryPoint], {
  cwd: path.join(__dirname, "backend"),
  env: { ...process.env, PORT: "3001" },
  stdio: "inherit"
});

// Обработка ошибок бэкенда
backendProcess.on('error', (error) => {
  console.error('Failed to start backend process:', error);
});

backendProcess.on('exit', (code, signal) => {
  console.log(`Backend process exited with code ${code} and signal ${signal}`);
});

// Небольшая задержка для старта бэкенда
setTimeout(() => {
  console.log("Backend should be ready, starting proxy server...");
}, 3000);

app.use("/api", createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
  logLevel: "debug",
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).send('Backend service unavailable');
  }
}));

// Обслуживаем статические файлы React
app.use(express.static(path.join(__dirname, "frontend/build")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/build/index.html"));
});

app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  backendProcess.kill("SIGTERM");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully...");
  backendProcess.kill("SIGINT");
  process.exit(0);
});