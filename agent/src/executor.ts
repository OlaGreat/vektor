/**
 * executor.ts — executes onchain actions via StrategyExecutor contract
 */

import { ethers } from "ethers";
import { config } from "./config.js";
import type { AgentAction, AgentDecision } from "./types.js";
import { log } from "./websocket.js";

// ActionType enum order must match StrategyExecutor.sol
const ACTION_TYPE = {
  ANALYZE: 0,
  BRIDGE_RECOMMEND: 1,
  STAKE: 2,
  UNSTAKE: 3,
  GAUGE_VOTE: 4,
  COMPOUND: 5,
  REBALANCE: 6,
} as const;

const EXECUTOR_ABI = [
  "function recordAction(address user, uint8 actionType, string calldata reasoning) external",
  "function updatePosition(address user, string calldata rollup, uint256 stakedAmount, uint256 lpAmount, uint256 esInitAccrued, string calldata positionType) external",
  "function recordGaugeVote(address user, string calldata rollup, uint256 weightBps) external",
  "function updateGaugeWeights(string[] calldata rollups, uint256[] calldata weights) external",
];

function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(config.evmRpcUrl, Number(config.chainId));
}

function getSigner(): ethers.Wallet {
  return new ethers.Wallet(config.deployerPrivateKey, getProvider());
}

async function sendTx(
  method: string,
  args: unknown[],
  description: string
): Promise<string> {
  const signer = getSigner();
  const executor = new ethers.Contract(
    config.executorAddress,
    EXECUTOR_ABI,
    signer
  );
  const tx = await executor[method](...args);
  const receipt = await tx.wait();
  log("ACTION", `${description} → tx ${receipt.hash}`);
  return receipt.hash as string;
}

const DEPLOYER = config.deployerPrivateKey
  ? new ethers.Wallet(config.deployerPrivateKey).address
  : ethers.ZeroAddress;

async function executeAction(action: AgentAction): Promise<void> {
  // Guard: ensure params object always exists
  action.params = action.params ?? {};
  switch (action.type) {
    case "LOG_REASONING": {
      const note = String(action.params.note ?? "");
      await sendTx(
        "recordAction",
        [DEPLOYER, ACTION_TYPE.ANALYZE, note],
        "Logged reasoning onchain"
      );
      break;
    }

    case "RECORD_STRATEGY": {
      const strategyText = String(action.params.strategyText ?? "");
      await sendTx(
        "recordAction",
        [DEPLOYER, ACTION_TYPE.ANALYZE, strategyText],
        "Recorded strategy onchain"
      );
      break;
    }

    case "REBALANCE_POSITION": {
      const rollupId = String(action.params.rollupId ?? "vektor-1");
      const allocationBps = Number(action.params.allocationBps ?? 0);
      const reason = String(action.params.reason ?? "");
      await sendTx(
        "updatePosition",
        [DEPLOYER, rollupId, allocationBps, 0, 0, "rebalance"],
        `Updated position: ${rollupId} → ${allocationBps} bps`
      );
      await sendTx(
        "recordAction",
        [DEPLOYER, ACTION_TYPE.REBALANCE, reason],
        "Logged rebalance onchain"
      );
      break;
    }

    case "RECOMMEND_GAUGE_VOTE": {
      const rollupId = String(action.params.rollupId ?? "vektor-1");
      const votePct = Number(action.params.votePct ?? 0);
      const reason = String(action.params.reason ?? "");
      // Convert percentage to basis points
      const weightBps = Math.min(10000, Math.round(votePct * 100));
      await sendTx(
        "recordGaugeVote",
        [DEPLOYER, rollupId, weightBps],
        `Recorded gauge vote: ${rollupId} ${votePct}%`
      );
      await sendTx(
        "recordAction",
        [DEPLOYER, ACTION_TYPE.GAUGE_VOTE, reason],
        "Logged gauge recommendation onchain"
      );
      break;
    }

    case "RECOMMEND_BRIDGE": {
      const reason = String(action.params.reason ?? "");
      await sendTx(
        "recordAction",
        [
          DEPLOYER,
          ACTION_TYPE.BRIDGE_RECOMMEND,
          `Bridge ${action.params.fromChain}→${action.params.toChain}: ${reason}`,
        ],
        `Logged bridge recommendation: ${action.params.fromChain} → ${action.params.toChain}`
      );
      break;
    }

    default:
      log(
        "INFO",
        `Skipping unknown action type: ${(action as AgentAction).type}`
      );
  }
}

export async function executeDecision(decision: AgentDecision): Promise<void> {
  log("REASONING", decision.summary, {
    reasoning: decision.reasoning,
    riskLevel: decision.riskLevel,
  });

  for (const action of decision.actions) {
    try {
      await executeAction(action);
    } catch (err) {
      log(
        "ERROR",
        `Action ${action.type} failed: ${(err as Error).message}`,
        action
      );
    }
  }
}
