/**
 * chain.ts — read-only queries against the vektor-1 rollup and Initia L1
 */

import { ethers } from "ethers";
import { config } from "./config.js";
import type { ChainState, GaugeWeight, OraclePrice } from "./types.js";

// ─── ABIs (minimal) ──────────────────────────────────────────────────────────

const VAULT_ABI = [
  "function totalAssets() view returns (uint256)",
  "function totalShares() view returns (uint256)",
];

const EXECUTOR_ABI = [
  "function getPrices(string[] memory pairs) view returns (uint256[] memory prices, uint256[] memory timestamps)",
];

const ORACLE_PAIRS = ["INIT/USD", "BTC/USD", "ETH/USD", "USDC/USD"];

// ─── Provider & contracts ─────────────────────────────────────────────────────

function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(
    config.evmRpcUrl,
    Number(config.chainId)
  );
}

// ─── EVM queries ──────────────────────────────────────────────────────────────

async function fetchVaultState(provider: ethers.JsonRpcProvider): Promise<{
  totalAssets: bigint;
  totalShares: bigint;
}> {
  const vault = new ethers.Contract(config.vaultAddress, VAULT_ABI, provider);
  const [totalAssets, totalShares] = await Promise.all([
    vault.totalAssets() as Promise<bigint>,
    vault.totalShares() as Promise<bigint>,
  ]);
  return { totalAssets, totalShares };
}

async function fetchOraclePrices(
  provider: ethers.JsonRpcProvider
): Promise<OraclePrice[]> {
  try {
    const executor = new ethers.Contract(
      config.executorAddress,
      EXECUTOR_ABI,
      provider
    );
    const [prices, timestamps] = (await executor.getPrices(ORACLE_PAIRS)) as [
      bigint[],
      bigint[],
    ];
    return ORACLE_PAIRS.map((pair, i) => ({
      pair,
      // Prices from Connect Oracle are in 1e8 fixed-point by convention
      price: Number(prices[i]) / 1e8,
      decimals: 8,
      timestamp: Number(timestamps[i]),
    }));
  } catch (err) {
    // Oracle may not have data for all pairs on testnet — return zeroes
    console.warn("[chain] oracle fetch failed:", (err as Error).message);
    return ORACLE_PAIRS.map((pair) => ({
      pair,
      price: 0,
      decimals: 8,
      timestamp: 0,
    }));
  }
}

// ─── Cosmos REST queries ──────────────────────────────────────────────────────

interface GaugeResponse {
  gauges?: Array<{
    rollup_id?: string;
    chain_id?: string;
    weight?: string;
  }>;
}

async function fetchGaugeWeights(): Promise<GaugeWeight[]> {
  try {
    const url = `${config.l1RestUrl}/initia/mstaking/v1/gauges`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as GaugeResponse;
    const gauges = data.gauges ?? [];
    const total = gauges.reduce((sum, g) => sum + BigInt(g.weight ?? "0"), 0n);
    return gauges.map((g) => {
      const w = BigInt(g.weight ?? "0");
      return {
        rollupId: g.rollup_id ?? g.chain_id ?? "unknown",
        weight: g.weight ?? "0",
        percentage: total > 0n ? Number((w * 10000n) / total) / 100 : 0,
      };
    });
  } catch {
    // L1 may be unreachable from local testnet
    return [{ rollupId: "vektor-1", weight: "0", percentage: 100 }];
  }
}

// ─── Exported ─────────────────────────────────────────────────────────────────

export async function getChainState(): Promise<ChainState> {
  const provider = getProvider();

  const [{ totalAssets, totalShares }, prices, gaugeWeights, blockNum] =
    await Promise.all([
      fetchVaultState(provider),
      fetchOraclePrices(provider),
      fetchGaugeWeights(),
      provider.getBlockNumber(),
    ]);

  return {
    prices,
    vaultTotalAssets: totalAssets.toString(),
    vaultTotalShares: totalShares.toString(),
    gaugeWeights,
    blockHeight: blockNum,
    timestamp: new Date().toISOString(),
  };
}
