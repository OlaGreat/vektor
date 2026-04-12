export interface OraclePrice {
  pair: string;
  price: number;
  decimals: number;
  timestamp: number;
}

export interface VaultState {
  totalAssets: bigint;
  totalShares: bigint;
  userCount: number;
}

export interface GaugeWeight {
  rollupId: string;
  weight: string;
  percentage: number;
}

export interface ChainState {
  prices: OraclePrice[];
  vaultTotalAssets: string;
  vaultTotalShares: string;
  gaugeWeights: GaugeWeight[];
  blockHeight: number;
  timestamp: string;
}

export interface AgentAction {
  type:
    | "REBALANCE_POSITION"
    | "RECORD_STRATEGY"
    | "LOG_REASONING"
    | "RECOMMEND_GAUGE_VOTE"
    | "RECOMMEND_BRIDGE";
  params: Record<string, string | number | boolean>;
}

export interface AgentDecision {
  summary: string;
  reasoning: string;
  actions: AgentAction[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface LogEntry {
  timestamp: string;
  type: "INFO" | "REASONING" | "ACTION" | "ERROR";
  message: string;
  data?: unknown;
}
