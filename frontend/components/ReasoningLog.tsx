"use client";

import { useEffect, useRef, useState } from "react";
import { wsUrl } from "@/lib/config";

interface LogEntry {
  timestamp: string;
  type: "INFO" | "REASONING" | "ACTION" | "ERROR";
  message: string;
  data?: unknown;
}

const TYPE_STYLES: Record<LogEntry["type"], string> = {
  INFO:      "text-slate-400",
  REASONING: "text-violet-300 font-medium",
  ACTION:    "text-emerald-400",
  ERROR:     "text-red-400",
};

const TYPE_PREFIX: Record<LogEntry["type"], string> = {
  INFO:      "·",
  REASONING: "◆",
  ACTION:    "→",
  ERROR:     "✗",
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

export default function ReasoningLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (event) => {
        try {
          const entry = JSON.parse(event.data as string) as LogEntry;
          setEntries((prev) => [...prev.slice(-199), entry]);
        } catch {
          // ignore malformed messages
        }
      };
    }

    connect();
    return () => wsRef.current?.close();
  }, []);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Agent Reasoning Log
        </h2>
        <span
          className={`flex items-center gap-1.5 text-xs ${connected ? "text-emerald-400" : "text-slate-500"}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
          {connected ? "live" : "connecting…"}
        </span>
      </div>

      {/* Log */}
      <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 min-h-0">
        {entries.length === 0 && (
          <p className="text-slate-600 text-center pt-8">
            {connected ? "Waiting for agent activity…" : "Connecting to agent…"}
          </p>
        )}
        {entries.map((entry, i) => (
          <div key={i} className={`log-entry flex gap-2 ${TYPE_STYLES[entry.type]}`}>
            <span className="shrink-0 text-slate-600">{formatTime(entry.timestamp)}</span>
            <span className="shrink-0">{TYPE_PREFIX[entry.type]}</span>
            <span className="break-all">{entry.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
