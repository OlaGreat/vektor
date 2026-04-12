"use client";

import "./globals.css";
import { InterwovenKitProvider, TESTNET } from "@initia/interwovenkit-react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Vektor — AI Position Optimizer</title>
        <meta
          name="description"
          content="AI agent that autonomously optimizes your Initia positions"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <InterwovenKitProvider {...TESTNET}>
          {children}
        </InterwovenKitProvider>
      </body>
    </html>
  );
}
