import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(): Record<string, string> {
  try {
    const envPath = resolve(__dirname, "../../.env");
    const content = readFileSync(envPath, "utf-8");
    const env: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

const env = { ...loadEnv(), ...process.env };

function required(key: string): string {
  const v = env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

function optional(key: string, fallback: string): string {
  return env[key] || fallback;
}

export const config = {
  claudeApiKey: required("CLAUDE_API_KEY"),
  deployerPrivateKey: required("DEPLOYER_PRIVATE_KEY"),

  evmRpcUrl: optional("NEXT_PUBLIC_EVM_RPC_URL", "http://localhost:8545"),
  restUrl: optional("NEXT_PUBLIC_REST_URL", "http://localhost:1317"),
  l1RestUrl: optional("L1_REST_URL", "https://rest.testnet.initia.xyz"),
  chainId: optional("NEXT_PUBLIC_EVM_CHAIN_ID", "3679952303222731"),

  vaultAddress: required("NEXT_PUBLIC_VAULT_ADDRESS"),
  executorAddress: required("NEXT_PUBLIC_EXECUTOR_ADDRESS"),
  depositTokenAddress: required("DEPOSIT_TOKEN_ADDRESS"),
  connectOracleAddress: required("CONNECT_ORACLE_ADDRESS"),

  wsPort: parseInt(optional("AGENT_WS_PORT", "8080"), 10),

  // How often the agent runs (milliseconds). Default: 5 minutes.
  intervalMs: parseInt(optional("AGENT_INTERVAL_MS", "300000"), 10),
};
