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

const ORACLE_PAIRS = ["BTC/USD", "ETH/USD", "USDC/USD", "SOL/USD"];

// Maps oracle pair → CoinGecko coin id for fallback
const COINGECKO_IDS: Record<string, string> = {
  "BTC/USD":  "bitcoin",
  "ETH/USD":  "ethereum",
  "USDC/USD": "usd-coin",
  "SOL/USD":  "solana",
  "INIT/USD": "initia",
};

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

// ─── CoinGecko fallback ───────────────────────────────────────────────────────

interface CoinGeckoResponse {
  [coinId: string]: { usd: number };
}

async function fetchCoinGeckoPrices(pairs: string[]): Promise<Map<string, number>> {
  const ids = [...new Set(pairs.map((p) => COINGECKO_IDS[p]).filter(Boolean))];
  if (ids.length === 0) return new Map();
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    const data = (await res.json()) as CoinGeckoResponse;
    const map = new Map<string, number>();
    for (const pair of pairs) {
      const id = COINGECKO_IDS[pair];
      if (id && data[id]?.usd) map.set(pair, data[id].usd);
    }
    return map;
  } catch (err) {
    console.warn("[chain] CoinGecko fallback failed:", (err as Error).message);
    return new Map();
  }
}

// ─── Oracle fetch with CoinGecko fallback ────────────────────────────────────

async function fetchOraclePrices(
  provider: ethers.JsonRpcProvider
): Promise<OraclePrice[]> {
  // Try Connect Oracle first (works on mainnet / oracle-enabled testnet)
  let onchainPrices: Map<string, { price: number; timestamp: number }> = new Map();
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
    for (let i = 0; i < ORACLE_PAIRS.length; i++) {
      const price = Number(prices[i]) / 1e8;
      if (price > 0) {
        onchainPrices.set(ORACLE_PAIRS[i], { price, timestamp: Number(timestamps[i]) });
      }
    }
  } catch {
    // Oracle contract reverted — all pairs will fall back to CoinGecko
  }

  // For pairs with 0 price, fall back to CoinGecko
  const missingPairs = ORACLE_PAIRS.filter((p) => !onchainPrices.has(p));
  const fallbackPrices = missingPairs.length > 0
    ? await fetchCoinGeckoPrices(missingPairs)
    : new Map<string, number>();

  const now = Math.floor(Date.now() / 1000);
  return ORACLE_PAIRS.map((pair) => {
    const onchain = onchainPrices.get(pair);
    if (onchain) {
      return { pair, price: onchain.price, decimals: 8, timestamp: onchain.timestamp, source: "oracle" as const };
    }
    const fallback = fallbackPrices.get(pair) ?? 0;
    return { pair, price: fallback, decimals: 8, timestamp: now, source: "coingecko" as const };
  });
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
