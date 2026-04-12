"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import Link from "next/link";

function truncate(addr: string): string {
  return addr ? `${addr.slice(0, 8)}…${addr.slice(-4)}` : "";
}

export default function Header() {
  const { address, username, openWallet, openConnect, disconnect, isConnected } =
    useInterwovenKit();

  return (
    <header className="border-b border-surface-border bg-surface-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-sm">
            V
          </div>
          <span className="font-semibold text-slate-200">Vektor</span>
          <span className="text-xs text-slate-600 hidden sm:block">/ vektor-1</span>
        </Link>

        <div className="flex items-center gap-3">
          {isConnected && address ? (
            <>
              <div className="text-right hidden sm:block">
                {username && (
                  <p className="text-sm font-medium text-slate-200">{username}.init</p>
                )}
                <p className="text-xs text-slate-500 font-mono">{truncate(address)}</p>
              </div>
              <button
                onClick={openWallet}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded border border-surface-border"
              >
                Wallet
              </button>
              <button
                onClick={disconnect}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={openConnect}
              className="px-4 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-medium transition-colors"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
