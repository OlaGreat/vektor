"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { contracts, chain } from "@/lib/config";
import { VAULT_ABI, ERC20_ABI } from "@/lib/abis";

interface VaultState {
  userShares: bigint;
  totalShares: bigint;
  totalAssets: bigint;
  userValue: bigint;
  usdcBalance: bigint;
  allowance: bigint;
}

const USDC_ADDRESS = process.env.NEXT_PUBLIC_DEPOSIT_TOKEN_ADDRESS ?? "";

function fmt6(v: bigint): string {
  return (Number(v) / 1e6).toFixed(2);
}

export default function PositionCard({ userAddress }: { userAddress: string }) {
  const [state, setState] = useState<VaultState | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!userAddress || !contracts.vault || !USDC_ADDRESS) return;
    try {
      const provider = new ethers.JsonRpcProvider(chain.evmRpcUrl);
      const vault = new ethers.Contract(contracts.vault, VAULT_ABI, provider);
      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

      const [userShares, totalShares, totalAssets, usdcBalance, allowance] =
        await Promise.all([
          vault.shares(userAddress) as Promise<bigint>,
          vault.totalShares() as Promise<bigint>,
          vault.totalAssets() as Promise<bigint>,
          usdc.balanceOf(userAddress) as Promise<bigint>,
          usdc.allowance(userAddress, contracts.vault) as Promise<bigint>,
        ]);

      const userValue =
        totalShares > BigInt(0)
          ? (userShares * totalAssets) / totalShares
          : BigInt(0);

      setState({ userShares, totalShares, totalAssets, userValue, usdcBalance, allowance });
    } catch (err) {
      console.error("[position]", err);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [userAddress]);

  async function getSigner(): Promise<ethers.Signer> {
    // Request signer via browser wallet (injected by InterwovenKit)
    const provider = new ethers.BrowserProvider(
      (window as unknown as { ethereum: ethers.Eip1193Provider }).ethereum
    );
    return provider.getSigner();
  }

  async function handleDeposit() {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return;
    setBusy(true);
    setError(null);
    setTxHash(null);
    try {
      const signer = await getSigner();
      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
      const vault = new ethers.Contract(contracts.vault, VAULT_ABI, signer);
      const amountBig = BigInt(Math.round(amount * 1e6));

      if ((state?.allowance ?? BigInt(0)) < amountBig) {
        const approveTx = await usdc.approve(contracts.vault, amountBig);
        await approveTx.wait();
      }

      const tx = await vault.deposit(amountBig);
      const receipt = await tx.wait();
      setTxHash(receipt.hash as string);
      setDepositAmount("");
      await load();
    } catch (err) {
      setError((err as Error).message.slice(0, 120));
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdraw() {
    const shareAmount = parseFloat(withdrawAmount);
    if (!shareAmount || shareAmount <= 0) return;
    setBusy(true);
    setError(null);
    setTxHash(null);
    try {
      const signer = await getSigner();
      const vault = new ethers.Contract(contracts.vault, VAULT_ABI, signer);
      const shareBig = BigInt(Math.round(shareAmount * 1e6));
      const tx = await vault.withdraw(shareBig);
      const receipt = await tx.wait();
      setTxHash(receipt.hash as string);
      setWithdrawAmount("");
      await load();
    } catch (err) {
      setError((err as Error).message.slice(0, 120));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5 space-y-5">
      <h3 className="font-semibold text-slate-200">Your Position</h3>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Vault value" value={state ? `$${fmt6(state.userValue)}` : "—"} />
        <Stat label="Shares held" value={state ? fmt6(state.userShares) : "—"} />
        <Stat label="Vault TVL" value={state ? `$${fmt6(state.totalAssets)}` : "—"} />
        <Stat label="Wallet USDC" value={state ? `$${fmt6(state.usdcBalance)}` : "—"} />
      </div>

      {/* Deposit */}
      <div className="space-y-2">
        <label className="text-xs text-slate-500 uppercase tracking-wider">Deposit USDC</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="0.00"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand"
          />
          <button
            onClick={handleDeposit}
            disabled={busy || !depositAmount}
            className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            Deposit
          </button>
        </div>
      </div>

      {/* Withdraw */}
      <div className="space-y-2">
        <label className="text-xs text-slate-500 uppercase tracking-wider">Withdraw shares</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="0.00"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand"
          />
          <button
            onClick={handleWithdraw}
            disabled={busy || !withdrawAmount}
            className="px-4 py-2 rounded-lg bg-surface-border hover:bg-surface-border/80 disabled:opacity-40 text-slate-300 text-sm font-medium transition-colors"
          >
            Withdraw
          </button>
        </div>
      </div>

      {txHash && (
        <p className="text-xs text-emerald-400 bg-emerald-400/10 rounded-lg px-3 py-2 break-all">
          Tx: {txHash}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2 break-all">
          {error}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-xl p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-100 mt-0.5">{value}</p>
    </div>
  );
}
