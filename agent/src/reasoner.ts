/**
 * reasoner.ts — Claude API strategy reasoning with OpenRouter fallback
 *
 * Priority:
 *   1. Claude API (if CLAUDE_API_KEY set and has credits)
 *   2. OpenRouter (if OPENROUTER_API_KEY set) — free models available
 */

import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import type { AgentDecision, ChainState } from "./types.js";

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Vektor, an autonomous DeFi strategy agent operating on the Initia blockchain ecosystem.

Your role:
- Analyze on-chain state: vault TVL, oracle prices, gauge vote weights
- Reason about optimal capital allocation across Initia rollups
- Recommend or execute: position rebalancing, gauge vote recommendations, bridge routing, esINIT compounding
- Prioritize capital efficiency and risk-adjusted returns

You must respond ONLY with a valid JSON object matching this schema:
{
  "summary": "one sentence describing what you decided",
  "reasoning": "2-5 sentence explanation of your analysis and why you chose this action",
  "actions": [
    {
      "type": "REBALANCE_POSITION" | "RECORD_STRATEGY" | "LOG_REASONING" | "RECOMMEND_GAUGE_VOTE" | "RECOMMEND_BRIDGE",
      "params": { key: value pairs specific to the action }
    }
  ],
  "riskLevel": "LOW" | "MEDIUM" | "HIGH"
}

Action types and their required params:
- LOG_REASONING: { note: string } — always include at least one of these
- REBALANCE_POSITION: { rollupId: string, allocationBps: number, reason: string }
- RECORD_STRATEGY: { strategyText: string }
- RECOMMEND_GAUGE_VOTE: { rollupId: string, votePct: number, reason: string }
- RECOMMEND_BRIDGE: { fromChain: string, toChain: string, amount: string, reason: string }

Be decisive. Always include at least one action. Respond ONLY with JSON, no markdown, no explanation outside the JSON.`;

function buildUserPrompt(state: ChainState): string {
  const priceTable = state.prices
    .map((p) => `  ${p.pair}: $${p.price.toFixed(2)}${p.source === "coingecko" ? " (market)" : " (oracle)"}`)
    .join("\n");

  const gaugeTable = state.gaugeWeights
    .map((g) => `  ${g.rollupId}: ${g.percentage.toFixed(2)}%`)
    .join("\n");

  const tvlUsdc = Number(BigInt(state.vaultTotalAssets)) / 1e6;

  return `Current chain state at block ${state.blockHeight} (${state.timestamp}):

Oracle Prices:
${priceTable || "  (no price data available)"}

Vault State:
  Total Assets: ${tvlUsdc.toFixed(2)} USDC
  Total Shares: ${state.vaultTotalShares}

VIP Gauge Weights (rollup allocation):
${gaugeTable || "  (no gauge data available)"}

Analyze this state and decide on the optimal strategy action. Consider:
1. Are prices showing movements that warrant rebalancing?
2. Are gauge weights aligned with expected APY for each rollup?
3. What is the current risk posture given vault TVL?

Respond with your decision as JSON only.`;
}

function parseDecision(text: string): AgentDecision {
  const jsonText = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  try {
    return JSON.parse(jsonText) as AgentDecision;
  } catch {
    return {
      summary: "Agent produced unstructured output",
      reasoning: text.slice(0, 500),
      actions: [{ type: "LOG_REASONING", params: { note: text.slice(0, 300) } }],
      riskLevel: "LOW",
    };
  }
}

// ─── Claude ───────────────────────────────────────────────────────────────────

async function reasonWithClaude(state: ChainState): Promise<AgentDecision> {
  const client = new Anthropic({ apiKey: config.claudeApiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(state) }],
  });
  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseDecision(text);
}

// ─── OpenRouter ───────────────────────────────────────────────────────────────

const OPENROUTER_MODEL = "google/gemma-4-31b-it:free";

interface OpenRouterResponse {
  choices: Array<{ message: { content: string } }>;
  error?: { message: string };
}

async function reasonWithOpenRouter(state: ChainState): Promise<AgentDecision> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openrouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/vektor-initia",
      "X-Title": "Vektor Agent",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(state) },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = (await res.json()) as OpenRouterResponse;
    throw new Error(`OpenRouter ${res.status}: ${err.error?.message ?? "unknown"}`);
  }

  const data = (await res.json()) as OpenRouterResponse;
  const text = data.choices?.[0]?.message?.content ?? "";
  return parseDecision(text);
}

// ─── Exported ─────────────────────────────────────────────────────────────────

export async function reason(state: ChainState): Promise<AgentDecision> {
  // Try Claude first
  if (config.claudeApiKey) {
    try {
      return await reasonWithClaude(state);
    } catch (err) {
      const msg = (err as Error).message ?? "";
      const isCredits = msg.includes("credit") || msg.includes("balance");
      const isAuth = msg.includes("401") || msg.includes("authentication");
      if (isCredits || isAuth) {
        console.warn("[reasoner] Claude unavailable, falling back to OpenRouter");
      } else {
        throw err; // real error, don't swallow
      }
    }
  }

  // Fall back to OpenRouter
  if (config.openrouterApiKey) {
    return await reasonWithOpenRouter(state);
  }

  throw new Error(
    "No LLM configured — set CLAUDE_API_KEY or OPENROUTER_API_KEY in .env"
  );
}
