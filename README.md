# Vektor

**An AI agent that plays the Initia VIP meta-game.**

Vektor monitors gauge weights, moves capital to underweighted rollups, stakes LP positions for dual rewards, casts gauge votes, and compounds esINIT — all autonomously, without you touching your wallet.

---

## What Vektor Does

The Initia ecosystem has a unique mechanism: the **VIP Gauge Voting loop**. Stakers vote to direct esINIT rewards toward rollups. LP tokens staked on those rollups simultaneously earn staking rewards AND liquidity fees. Capital that lands in the right rollup at the right time earns dramatically more than capital sitting still.

Most users never exploit this. The gauge allocation data is onchain, but acting on it requires:
- Monitoring gauge weights across all rollups
- Bridging capital via Minitswap at the right moment
- Providing liquidity on InitiaDEX and staking LP tokens
- Casting gauge votes to amplify rewards
- Vesting esINIT back into enshrined liquidity positions
- Doing all of this continuously, 24/7

Vektor does all of it. You deposit once. You describe your goal. The agent executes forever.

---

## How It Works

```
You type: "Maximize my esINIT accumulation"

Vektor:
→ Reads gauge weights across all Initia rollups
→ Identifies Rollup B is underweighted by 19% relative to its TVL
→ Bridges 60% of your capital there via Minitswap (instant, no 7-day wait)
→ Provides liquidity on InitiaDEX INIT-paired pool
→ Stakes LP tokens (earning staking rewards + liquidity fees simultaneously)
→ Casts gauge vote toward Rollup B (amplifying your esINIT rewards)
→ Monitors esINIT vesting — compounds into enshrined liquidity at optimal epoch
→ Repeats every epoch, adapting as gauge weights shift
```

Every decision is visible. Every action is logged. Auto-signing handles execution — no wallet popups, ever.

---

## Initia-Native Features Used

| Feature | Role in Vektor |
|---|---|
| **VIP Gauge Voting** | Core intelligence — agent reads weights, finds allocation alpha |
| **esINIT / Enshrined Liquidity** | The asset being optimized — dual staking + liquidity rewards |
| **Minitswap** | Instant cross-rollup capital routing without challenge periods |
| **Connect Oracle** | Real-time prices for LP ratio management and rebalance decisions |
| **Auto-signing** | Agent executes 24/7 with zero wallet popups |
| **Initia MCP** | Agent queries all rollup state via AI-native protocol |
| **InterwovenKit** | Wallet connection and auto-sign session management |
| **InitiaDEX** | LP provision and swap execution |
| **.init Usernames** | Portfolio identity — your portfolio lives at `vektor.app/[name].init` |
| **IBC Bridge** | Onboard assets from external chains |

---

## Revenue Model

- **10% of esINIT earned** by the agent on your behalf → Vektor protocol treasury
- **0.3% fee** on each bridge/swap execution
- Revenue is denominated in esINIT — Vektor grows with the Initia ecosystem

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + Tailwind CSS |
| Wallet & Transactions | `@initia/interwovenkit-react` |
| Smart Contracts | Solidity on MiniEVM |
| AI Agent | Claude API (reasoning + strategy) |
| Chain Interaction | Initia MCP + `initia.js` |
| Oracle | Connect Oracle (native price feeds) |
| Bridge | Minitswap + IBC |

---

## Tracks

**AI & Tooling** — An AI agent that autonomously manages onchain positions, reads protocol-level data, reasons about optimal allocation, and executes cross-rollup strategies without human intervention.

---

## Repository Structure

```
vektor/
├── contracts/          # Solidity — Vault, StrategyExecutor, fee logic
├── agent/              # AI agent — strategy reasoning, MCP integration
├── frontend/           # Next.js app — dashboard, auto-sign, portfolio
├── scripts/            # Deployment and setup scripts
├── .initia/            # Initia submission metadata
│   └── submission.json
├── ARCHITECTURE.md
└── README.md
```

---

## Submission

- **Track:** AI & Tooling
- **Chain:** MiniEVM rollup on Initia testnet
- **Rollup Chain ID:** *(added after deployment)*
- **Demo:** *(link added before submission)*

---

## Setup & Running

> Full setup instructions will be added as development progresses.

### Prerequisites
- Node.js 18+
- Foundry
- Docker Desktop (for IBC relayer)
- Go 1.22+

### Quick Start
```bash
git clone https://github.com/[repo]/vektor
cd vektor
npm install
cp .env.example .env
# Fill in your keys and chain config
npm run dev
```
