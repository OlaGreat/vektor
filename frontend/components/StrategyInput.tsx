"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { contracts, chain } from "@/lib/config";
import { VAULT_ABI } from "@/lib/abis";

export default function StrategyInput({ userAddress }: { userAddress: string }) {
  const [strategy, setStrategy] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!strategy.trim() || !userAddress) return;
    setBusy(true);
    setError(null);
    try {
      const provider = new ethers.BrowserProvider(
        (window as unknown as { ethereum: ethers.Eip1193Provider }).ethereum
      );
      const signer = await provider.getSigner();
      const vault = new ethers.Contract(contracts.vault, VAULT_ABI, signer);
      const tx = await vault.setStrategy(strategy.trim());
      await tx.wait();
      setSaved(strategy.trim());
      setStrategy("");
    } catch (err) {
      setError((err as Error).message.slice(0, 120));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5 space-y-3">
      <div>
        <h3 className="font-semibold text-slate-200">Strategy Instructions</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Tell the agent how you want your positions managed
        </p>
      </div>

      {saved && (
        <div className="text-xs text-slate-400 bg-surface rounded-lg px-3 py-2 border border-surface-border">
          <span className="text-slate-600">Current: </span>
          {saved}
        </div>
      )}

      <textarea
        rows={3}
        value={strategy}
        onChange={(e) => setStrategy(e.target.value)}
        placeholder="e.g. Maximize INIT yield, prioritize rollups with highest VIP gauge weight, keep 20% in stable positions…"
        className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand resize-none"
      />

      <button
        onClick={save}
        disabled={busy || !strategy.trim()}
        className="w-full py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-40 text-white text-sm font-medium transition-colors"
      >
        {busy ? "Saving…" : "Save Strategy"}
      </button>

      {error && (
        <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
