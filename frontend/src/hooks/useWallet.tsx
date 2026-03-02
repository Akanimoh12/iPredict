"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  connect as stacksConnect,
  disconnect as stacksDisconnect,
  isConnected as stacksIsConnected,
  getLocalStorage,
} from "@stacks/connect";
import { NETWORK_NAME } from "@/config/network";
import { AppErrorType } from "@/types";
import type { AppError } from "@/types";

// ── Context shape ─────────────────────────────────────────────────────────────

interface WalletContextValue {
  publicKey: string | null;
  connected: boolean;
  connecting: boolean;
  error: AppError | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue>({
  publicKey: null,
  connected: false,
  connecting: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // ── Auto-reconnect on mount ───────────────────────────────────────────────
  // @stacks/connect v8 persists the selected provider & addresses in localStorage.
  // If the user was previously connected, restore the STX address.

  useEffect(() => {
    try {
      if (stacksIsConnected()) {
        const stored = getLocalStorage();
        if (stored?.addresses?.stx) {
          // addresses.stx is an array of AddressEntry objects
          const stxAddr = stored.addresses.stx[0]?.address;
          if (stxAddr) {
            setPublicKey(stxAddr);
          }
        }
      }
    } catch {
      // localStorage not available (SSR) or data malformed — ignore
    }
  }, []);

  // ── Connect ─────────────────────────────────────────────────────────────────
  // In @stacks/connect v8, `connect()` opens the wallet selector popup
  // and returns a Promise<GetAddressesResult> with the user's addresses.

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);

    try {
      const network = NETWORK_NAME === "mainnet" ? "mainnet" : "testnet";
      const result = await stacksConnect({ network });

      // Find the STX address from the returned addresses
      const stxEntry = result.addresses.find(
        (a) => a.symbol === "STX" || a.address?.startsWith("SP") || a.address?.startsWith("ST")
      );

      if (stxEntry?.address) {
        setPublicKey(stxEntry.address);
      } else {
        setError({
          type: AppErrorType.WALLET,
          message: "Could not retrieve STX address after connecting",
        });
      }
    } catch (err) {
      // User closed the popup or wallet not installed
      const message =
        err instanceof Error ? err.message : "Failed to connect wallet";
      // Don't treat popup-closed as a real error
      if (!message.includes("cancel") && !message.includes("closed")) {
        setError({ type: AppErrorType.WALLET, message });
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  // ── Disconnect ──────────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    stacksDisconnect();
    setPublicKey(null);
    setError(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        connected: publicKey !== null,
        connecting,
        error,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWallet() {
  return useContext(WalletContext);
}
