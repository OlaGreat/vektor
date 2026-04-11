# Vektor — Architecture

## Overview

Vektor is a cross-rollup AI agent built on Initia's MiniEVM. It continuously optimizes a user's position across the entire Initia ecosystem by monitoring gauge weights, routing capital via Minitswap, staking LP tokens on InitiaDEX, and casting gauge votes — all through auto-signing with no wallet interaction required.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER                                   │
│   Connects wallet → Sets strategy → Enables auto-sign → Done   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                 │
│                    Next.js + Tailwind                           │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ InterwovenKit   │  │ Strategy     │  │ Portfolio         │  │
│  │ Wallet + Auto-  │  │ Input UI     │  │ Dashboard         │  │
│  │ Sign Sessions   │  │              │  │ (positions, log)  │  │
│  └────────┬────────┘  └──────┬───────┘  └────────┬──────────┘  │
└───────────┼─────────────────┼───────────────────┼─────────────┘
            │                 │                   │
            ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         AI AGENT                                │
│                   (Node.js + Claude API)                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Strategy Reasoner                       │   │
│  │  • Parses user goal (naturalg language → structured plan) │   │
│  │  • Reads gauge weights from Initia L1 via Initia MCP    │   │
│  │  • Identifies underweighted rollups (alpha detection)   │   │
│  │  • Decides: bridge | stake | vote | compound | wait     │   │
│  │  • Produces human-readable reasoning log                │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │                  Action Executor                         │   │
│  │  • Translates decisions into contract calls              │   │
│  │  • Routes through Initia MCP for chain queries           │   │
│  │  • Submits txs via auto-sign session key                 │   │
│  │  • Handles failures + retries                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌────────────────────┐
│  Initia MCP  │ │ Connect  │ │  Initia.js SDK      │
│              │ │ Oracle   │ │                     │
│ Query state  │ │          │ │ Tx building         │
│ across all   │ │ Price    │ │ Account management  │
│ rollups      │ │ feeds    │ │ Message signing     │
└──────┬───────┘ └────┬─────┘ └──────────┬──────────┘
       │              │                  │
       └──────────────┼──────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ONCHAIN LAYER                              │
│                                                                 │
│   Initia L1                    MiniEVM Appchain (Vektor)        │
│   ─────────                    ─────────────────────────        │
│   • VIP gauge weights          • VektorVault.sol                │
│   • esINIT distribution        • StrategyExecutor.sol           │
│   • Governance proposals       • FeeCollector.sol               │
│   • InitiaDEX pools            • PositionManager.sol            │
│                                                                 │
│   Cross-Rollup                 External                         │
│   ────────────                 ────────                         │
│   • Minitswap (bridging)       • IBC connected chains           │
│   • IBC relayer                • LayerZero (external assets)    │
│   • Rollup indexer API                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Frontend (`/frontend`)

**Stack:** Next.js 14 (App Router) + Tailwind CSS + `@initia/interwovenkit-react`

**Key screens:**
- `/` — Landing page, connect wallet, set strategy
- `/dashboard` — Live portfolio: positions across rollups, esINIT balance, accumulated fees, agent reasoning log
- `/[username].init` — Public shareable portfolio view via .init username
- `/settings` — Auto-sign session config, strategy adjustment, risk controls

**InterwovenKit integration:**
- `<InterwovenKitProvider>` wraps the app
- `useAutoSign()` — enables session key for agent execution
- `useWallet()` — handles connect/disconnect
- `<TransferModal>` — Interwoven Bridge UI for onboarding assets

---

### 2. AI Agent (`/agent`)

**Stack:** Node.js + Claude API (claude-sonnet-4-6) + Initia MCP client

**Agent loop (runs every epoch / on trigger):**

```
1. OBSERVE
   → Query all rollup gauge weights (Initia L1 via MCP)
   → Query user positions across rollups (MCP)
   → Fetch current prices (Connect Oracle)
   → Fetch esINIT vesting schedules (chain state)

2. REASON  (Claude API call)
   → Input: current state + user strategy + positions
   → Output: structured action plan + human-readable reasoning
   → Model weighs: expected esINIT delta, gas costs, bridge timing, LP ratios

3. EXECUTE
   → Translate action plan into contract calls
   → Submit via auto-sign session key (no wallet popup)
   → Log all actions onchain + in agent DB

4. REPORT
   → Push reasoning log to frontend via WebSocket
   → Update portfolio state
   → Schedule next run
```

**Strategy types supported:**
- `maximize_esinit` — maximize esINIT accumulation via gauge alpha
- `maximize_yield` — highest combined APR (staking + liquidity fees)
- `conservative` — minimize rebalancing, prefer stable positions
- `custom` — user-defined natural language goal

---

### 3. Smart Contracts (`/contracts`)

**VM:** MiniEVM (Solidity ^0.8.24)

#### `VektorVault.sol`
- Holds user deposits
- Issues vault shares (ERC20)
- Tracks positions per rollup
- Collects protocol fees (10% of esINIT earned, 0.3% on executions)

#### `StrategyExecutor.sol`
- Called by agent's session key (auto-sign)
- Executes: bridge calls, LP deposits, gauge votes, stake/unstake
- Whitelisted callers only (session key + owner)
- Reads price data from Connect Oracle

#### `PositionManager.sol`
- Tracks LP token positions across rollups
- Manages esINIT vesting schedules
- Handles compound triggers

#### `FeeCollector.sol`
- Accumulates protocol revenue
- Distributes esINIT to treasury

**Connect Oracle integration:**
```solidity
IConnectOracle constant oracle = IConnectOracle(CONNECT_ORACLE_ADDR);

function getPrice(string memory pair) internal view returns (uint256) {
    IConnectOracle.Price memory p = oracle.get_price(pair);
    return p.price;
}
```

---

### 4. Initia MCP Integration (`/agent/mcp`)

Initia MCP is the AI-native protocol for querying Initia chain state. Vektor uses it to:

- **Read gauge weights:** Which rollups are over/underweighted relative to TVL
- **Read user positions:** Balances, LP stakes, pending esINIT across all rollups
- **Read pool state:** InitiaDEX pool depths, current APRs
- **Execute transactions:** Bridge, stake, vote — via structured MCP tool calls

This is the layer that makes the agent genuinely cross-rollup rather than single-chain.

---

## Data Flow: One Agent Cycle

```
Agent wakes (cron / epoch trigger)
    │
    ├─► MCP: fetch gauge weights (L1)
    ├─► MCP: fetch user positions (all rollups)
    ├─► Connect Oracle: fetch prices (ETH/USD, INIT/USD, etc.)
    │
    ▼
Claude API: reason over state
    │
    Output: {
      action: "bridge_and_stake",
      from_rollup: "rollup-a",
      to_rollup: "rollup-b",
      amount: "60%",
      reasoning: "rollup-b gauge underweighted by 19%, projected 3.4x esINIT gain",
      gauge_vote: { rollup_b: 40, rollup_a: 60 }
    }
    │
    ▼
StrategyExecutor.sol (called via auto-sign session key)
    │
    ├─► Minitswap bridge: rollup-a → rollup-b
    ├─► InitiaDEX: provide liquidity → receive LP tokens
    ├─► Stake LP tokens → earn staking rewards + fees
    └─► Cast gauge vote → amplify esINIT allocation to rollup-b
    │
    ▼
Log to DB + push to frontend via WebSocket
    │
    ▼
Sleep until next epoch
```

---

## Security Model

- **Auto-sign session keys** are scoped: time-limited, chain-specific, user-revokable at any time
- **StrategyExecutor** only accepts calls from whitelisted session keys
- **Vault funds never leave** without user-authorized session key
- **No admin keys** on the vault after deployment — owner is a multisig
- **Slippage protection** on all swaps and bridge calls
- **Position size limits** per rollup to limit concentration risk

---

## Deployment

### Appchain
- VM: MiniEVM
- Deployed via `weave rollup launch`
- Gas token: INIT
- DA layer: Celestia

### Contracts
- Deployed via Foundry (`forge deploy`)
- Verified on InitiaScan

### Agent
- Hosted on VPS / cloud
- Cron-triggered per epoch
- MCP client authenticated via gas station account

### Frontend
- Deployed on Vercel
- ENV: RPC endpoints, contract addresses, Claude API key

---

## Environment Variables

```env
# Chain
NEXT_PUBLIC_CHAIN_ID=
NEXT_PUBLIC_RPC_URL=
NEXT_PUBLIC_VAULT_ADDRESS=
NEXT_PUBLIC_EXECUTOR_ADDRESS=

# Agent
CLAUDE_API_KEY=
INITIA_MCP_ENDPOINT=
GAS_STATION_MNEMONIC=

# Oracle
CONNECT_ORACLE_ADDRESS=
```
