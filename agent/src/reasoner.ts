/**
 * reasoner.ts — Claude API strategy reasoning
 */

import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import type { AgentDecision, ChainState } from "./types.js";

const client = new Anthropic({ apiKey: config.claudeApiKey });

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

Be decisive. If no rebalancing is needed, say so and log your reasoning. Always include at least one action.`;

function buildUserPrompt(state: ChainState): string {
  const priceTable = state.prices
    .map((p) => `  ${p.pair}: $${p.price.toFixed(4)}`)
    .join("\n");

  const gaugeTable = state.gaugeWeights
    .map((g) => `  ${g.rollupId}: ${g.percentage.toFixed(2)}%`)
    .join("\n");

  const tvlUsdc =
    Number(BigInt(state.vaultTotalAssets)) / 1e6;

  return `Current chain state at block ${state.blockHeight} (${state.timestamp}):

Oracle Prices:
${priceTable || "  (no price data available)"}

Vault State:
  Total Assets: ${tvlUsdc.toFixed(2)} USDC
  Total Shares: ${state.vaultTotalShares}

VIP Gauge Weights (rollup allocation):
${gaugeTable || "  (no gauge data available)"}

Analyze this state and decide on the optimal strategy action. Consider:
1. Are oracle prices showing any significant movements that warrant rebalancing?
2. Are gauge weights aligned with expected APY for each rollup?
3. Is the vault TVL large enough to benefit from cross-rollup optimization?
4. What is the current risk posture?

Respond with your decision as JSON.`;
}

export async function reason(state: ChainState): Promise<AgentDecision> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(state),
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Strip markdown code fences if present
  const jsonText = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();

  try {
    return JSON.parse(jsonText) as AgentDecision;
  } catch {
    // Fallback: return a minimal valid decision with the raw text as reasoning
    return {
      summary: "Agent produced unstructured output",
      reasoning: text.slice(0, 500),
      actions: [{ type: "LOG_REASONING", params: { note: text.slice(0, 300) } }],
      riskLevel: "LOW",
    };
  }
}
