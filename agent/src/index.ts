/**
 * index.ts — Vektor agent entry point
 * Runs the strategy loop on a configurable interval (default 5 min).
 */

import { config } from "./config.js";
import { startWebSocketServer, log } from "./websocket.js";
import { getChainState } from "./chain.js";
import { reason } from "./reasoner.js";
import { executeDecision } from "./executor.js";

let running = false;

async function runCycle(): Promise<void> {
  if (running) {
    log("INFO", "Previous cycle still running — skipping");
    return;
  }
  running = true;
  try {
    log("INFO", "Starting strategy cycle");

    const state = await getChainState();
    log("INFO", `Chain state fetched at block ${state.blockHeight}`, {
      tvl: state.vaultTotalAssets,
      prices: state.prices,
    });

    const decision = await reason(state);
    await executeDecision(decision);

    log("INFO", "Cycle complete");
  } catch (err) {
    log("ERROR", `Cycle failed: ${(err as Error).message}`);
  } finally {
    running = false;
  }
}

async function main(): Promise<void> {
  log("INFO", `Vektor agent starting — interval ${config.intervalMs}ms`);

  startWebSocketServer();

  // Run immediately on startup
  await runCycle();

  // Then on interval
  setInterval(() => {
    runCycle().catch((err) =>
      log("ERROR", `Unhandled cycle error: ${(err as Error).message}`)
    );
  }, config.intervalMs);

  log("INFO", `Next cycle in ${config.intervalMs / 1000}s`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
