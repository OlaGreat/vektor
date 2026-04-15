"use client";

import { InterwovenKitProvider, TESTNET } from "@initia/interwovenkit-react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mainnet } from "wagmi/chains";
import { useState } from "react";

// Minimal wagmi config — InterwovenKit manages its own chain connections,
// wagmi just needs to be present as a provider context.
const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
  ssr: true,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <InterwovenKitProvider {...TESTNET}>
          {children}
        </InterwovenKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
