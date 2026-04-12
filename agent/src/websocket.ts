import { WebSocketServer, WebSocket } from "ws";
import { config } from "./config.js";
import type { LogEntry } from "./types.js";

let wss: WebSocketServer | null = null;
const recentLogs: LogEntry[] = [];
const MAX_BUFFERED = 200;

export function startWebSocketServer(): void {
  wss = new WebSocketServer({ port: config.wsPort });

  wss.on("connection", (ws: WebSocket) => {
    // Send recent history to new clients so the dashboard isn't blank
    for (const entry of recentLogs) {
      ws.send(JSON.stringify(entry));
    }

    ws.on("error", (err) => {
      console.error("[ws] client error:", err.message);
    });
  });

  wss.on("error", (err) => {
    console.error("[ws] server error:", err.message);
  });

  console.log(`[ws] WebSocket server listening on port ${config.wsPort}`);
}

export function broadcast(entry: LogEntry): void {
  recentLogs.push(entry);
  if (recentLogs.length > MAX_BUFFERED) recentLogs.shift();

  if (!wss) return;
  const msg = JSON.stringify(entry);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

export function log(
  type: LogEntry["type"],
  message: string,
  data?: unknown
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    type,
    message,
    data,
  };
  const prefix =
    type === "ERROR" ? "✗" : type === "ACTION" ? "→" : type === "REASONING" ? "◆" : "·";
  console.log(`${prefix} [${entry.timestamp}] ${message}`);
  broadcast(entry);
}
