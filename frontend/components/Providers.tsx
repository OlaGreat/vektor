"use client";

import { InterwovenKitProvider, TESTNET } from "@initia/interwovenkit-react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <InterwovenKitProvider {...TESTNET}>
      {children}
    </InterwovenKitProvider>
  );
}
