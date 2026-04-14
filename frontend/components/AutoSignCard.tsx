"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useEffect, useState } from "react";
import { chain } from "@/lib/config";

const CTRL_URL =
  typeof window !== "undefined"
    ? `http://${window.location.hostname}:${(parseInt(process.env.NEXT_PUBLIC_AGENT_WS_PORT ?? "8080", 10) + 1)}`
    : "http://localhost:8081";

async function agentControl(action: "pause" | "resume"): Promise<void> {
  await fetch(`${CTRL_URL}/${action}`, { method: "POST" }).catch(() => {
    // Agent may not be running — ignore silently
  });
}

export default function AutoSignCard() {
  const { autoSign } = useInterwovenKit();
  const isEnabled = autoSign.isEnabledByChain[chain.cosmosChainId] ?? false;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentPaused, setAgentPaused] = useState<boolean | null>(null);

  // Poll agent status
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch(`${CTRL_URL}/status`);
        if (res.ok) {
          const data = (await res.json()) as { paused: boolean };
          setAgentPaused(data.paused);
        }
      } catch {
        setAgentPaused(null);
      }
    }
    checkStatus();
    const id = setInterval(checkStatus, 5000);
    return () => clearInterval(id);
  }, []);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      if (isEnabled) {
        // Disable: revoke InterwovenKit authz + pause agent
        await autoSign.disable(chain.cosmosChainId);
        await agentControl("pause");
        setAgentPaused(true);
      } else {
        // Enable: grant InterwovenKit authz + resume agent
        await autoSign.enable(chain.cosmosChainId);
        await agentControl("resume");
        setAgentPaused(false);
      }
    } catch (err) {
      setError((err as Error).message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  const expiry = autoSign.expiredAtByChain[chain.cosmosChainId];
  const agentRunning = agentPaused === false;

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-200">Auto-sign</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Allow agent to execute txs without wallet popups
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={busy || autoSign.isLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isEnabled ? "bg-brand" : "bg-surface-border"
          } ${busy || autoSign.isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              isEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-slate-500">
          <span>Wallet authz</span>
          <span className={isEnabled ? "text-emerald-400" : "text-slate-400"}>
            {isEnabled ? "Granted" : "Not granted"}
          </span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Agent execution</span>
          <span
            className={
              agentPaused === null
                ? "text-slate-600"
                : agentRunning
                ? "text-emerald-400"
                : "text-amber-400"
            }
          >
            {agentPaused === null ? "—" : agentRunning ? "Active" : "Paused"}
          </span>
        </div>
        {expiry && (
          <div className="flex justify-between text-slate-500">
            <span>Session expires</span>
            <span className="text-slate-400 font-mono text-xs">
              {expiry.toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex justify-between text-slate-500">
          <span>Chain</span>
          <span className="text-slate-400">{chain.cosmosChainId}</span>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {!isEnabled && (
        <p className="mt-3 text-xs text-slate-600">
          Enable auto-sign so the AI agent can execute strategy actions without
          interrupting you for each transaction.
        </p>
      )}
    </div>
  );
}
