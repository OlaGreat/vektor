"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import Link from "next/link";

export default function HomePage() {
  const { address, isConnected, openConnect } = useInterwovenKit();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-lg">
            V
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Vektor</h1>
        </div>

        <p className="text-xl text-slate-400 leading-relaxed">
          An AI agent that autonomously optimizes your Initia positions —
          monitoring VIP gauge weights, routing capital, and compounding
          esINIT rewards across rollups.
        </p>

        <div className="flex flex-wrap gap-2 justify-center text-sm">
          {[
            "Auto-signing",
            "Oracle-driven",
            "Gauge analysis",
            "esINIT compounding",
            "Cross-rollup routing",
          ].map((f) => (
            <span
              key={f}
              className="px-3 py-1 rounded-full bg-surface-card border border-surface-border text-slate-300"
            >
              {f}
            </span>
          ))}
        </div>

        <div className="pt-4">
          {isConnected && address ? (
            <Link
              href="/dashboard"
              className="inline-block px-8 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold transition-colors"
            >
              Open Dashboard →
            </Link>
          ) : (
            <button
              onClick={openConnect}
              className="px-8 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>

        <p className="text-xs text-slate-600 pt-2">
          Running on vektor-1 testnet · Rollup powered by Initia MiniEVM
        </p>
      </div>
    </main>
  );
}
