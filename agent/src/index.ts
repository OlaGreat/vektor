/**
 * index.ts — Vektor agent entry point
 * Runs the strategy loop on a configurable interval (default 5 min).
 * Exposes a tiny HTTP control server on port AGENT_WS_PORT+1 for pause/resume.
 */

import { createServer } from "http";
import { config } from "./config.js";
import { startWebSocketServer, log } from "./websocket.js";
import { getChainState } from "./chain.js";
import { reason } from "./reasoner.js";
import { executeDecision } from "./executor.js";

let running = false;
let paused = false;

async function runCycle(): Promise<void> {
  if (paused) {
    log("INFO", "Agent paused — skipping cycle (auto-sign disabled)");
    return;
  }
  if (running) {
    log("INFO", "Previous cycle still running — skipping");
    return;
  }
  running = true;
  try {
    log("INFO", "Starting strategy cycle");

    const state = await getChainState();

    const priceLines = state.prices
      .map((p) => `${p.pair}: $${p.price.toFixed(2)}${p.source === "coingecko" ? " (cg)" : ""}`)
      .join(", ");
    log("INFO", `Block ${state.blockHeight} | ${priceLines}`, {
      tvl: state.vaultTotalAssets,
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

function startControlServer(): void {
  const port = config.wsPort + 1; // e.g. 8081
  const server = createServer((req, res) => {
    // CORS for frontend
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Content-Type", "application/json");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === "/status" && req.method === "GET") {
      res.writeHead(200);
      res.end(JSON.stringify({ paused, running }));
      return;
    }

    if (req.url === "/pause" && req.method === "POST") {
      paused = true;
      log("INFO", "Agent paused via auto-sign toggle");
      res.writeHead(200);
      res.end(JSON.stringify({ paused }));
      return;
    }

    if (req.url === "/resume" && req.method === "POST") {
      paused = false;
      log("INFO", "Agent resumed via auto-sign toggle");
      // Kick off a cycle immediately
      runCycle().catch((err) =>
        log("ERROR", `Unhandled cycle error: ${(err as Error).message}`)
      );
      res.writeHead(200);
      res.end(JSON.stringify({ paused }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "not found" }));
  });

  server.listen(port, () => {
    console.log(`[ctrl] Control server listening on port ${port}`);
  });
}

async function main(): Promise<void> {
  log("INFO", `Vektor agent starting — interval ${config.intervalMs}ms`);

  startWebSocketServer();
  startControlServer();

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
