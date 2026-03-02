"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ToastProvider } from "@/hooks/useToast";

// Dynamic import of WalletProvider — avoids SSR issues with @stacks/connect
// which depends on browser APIs (window, localStorage)
const WalletProvider = dynamic(
  () => import("@/hooks/useWallet").then((mod) => mod.WalletProvider),
  {
    ssr: false,
    loading: () => null,
  }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <ToastProvider>{children}</ToastProvider>
    </WalletProvider>
  );
}
