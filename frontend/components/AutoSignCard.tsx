"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useState } from "react";
import { chain } from "@/lib/config";

export default function AutoSignCard() {
  const { autoSign } = useInterwovenKit();
  const isEnabled = autoSign.isEnabledByChain[chain.cosmosChainId] ?? false;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      if (isEnabled) {
        await autoSign.disable(chain.cosmosChainId);
      } else {
        await autoSign.enable(chain.cosmosChainId);
      }
    } catch (err) {
      setError((err as Error).message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  const expiry = autoSign.expiredAtByChain[chain.cosmosChainId];

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
          <span>Status</span>
          <span className={isEnabled ? "text-emerald-400" : "text-slate-400"}>
            {isEnabled ? "Active" : "Inactive"}
          </span>
        </div>
        {expiry && (
          <div className="flex justify-between text-slate-500">
            <span>Expires</span>
            <span className="text-slate-400 font-mono">
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
