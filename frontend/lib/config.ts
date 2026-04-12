export const chain = {
  chainId: process.env.NEXT_PUBLIC_EVM_CHAIN_ID ?? "3679952303222731",
  cosmosChainId: process.env.NEXT_PUBLIC_CHAIN_ID ?? "vektor-1",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? "http://localhost:26657",
  restUrl: process.env.NEXT_PUBLIC_REST_URL ?? "http://localhost:1317",
  evmRpcUrl: process.env.NEXT_PUBLIC_EVM_RPC_URL ?? "http://localhost:8545",
  name: "Vektor",
  nativeDenom: "uvektor",
};

export const contracts = {
  vault: process.env.NEXT_PUBLIC_VAULT_ADDRESS ?? "",
  executor: process.env.NEXT_PUBLIC_EXECUTOR_ADDRESS ?? "",
};

export const wsUrl =
  typeof window !== "undefined"
    ? `ws://${window.location.hostname}:${process.env.NEXT_PUBLIC_AGENT_WS_PORT ?? "8080"}`
    : "ws://localhost:8080";
