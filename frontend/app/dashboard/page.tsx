"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/Header";
import PositionCard from "@/components/PositionCard";
import AutoSignCard from "@/components/AutoSignCard";
import ReasoningLog from "@/components/ReasoningLog";
import StrategyInput from "@/components/StrategyInput";

export default function DashboardPage() {
  const { address, isConnected } = useInterwovenKit();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: position + strategy + auto-sign */}
        <div className="lg:col-span-1 space-y-5">
          <PositionCard userAddress={address} />
          <StrategyInput userAddress={address} />
          <AutoSignCard />
        </div>

        {/* Right column: reasoning log */}
        <div className="lg:col-span-2 bg-surface-card border border-surface-border rounded-2xl p-5 flex flex-col min-h-[500px] lg:min-h-0 lg:h-[calc(100vh-7rem)]">
          <ReasoningLog />
        </div>
      </div>
    </div>
  );
}
