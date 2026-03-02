import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockSignTransaction = vi.fn();

let walletState = {
  publicKey: null as string | null,
  connected: false,
  connecting: false,
  error: null as null,
  connect: mockConnect,
  disconnect: mockDisconnect,
  signTransaction: mockSignTransaction,
  walletType: null as null,
};

vi.mock("@/hooks/useWallet", () => ({
  useWallet: () => walletState,
}));

import WalletConnect from "@/components/wallet/WalletConnect";

// ── Tests ──────────────────────────────────────────────────────────────────

describe("WalletConnect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    walletState = {
      publicKey: null,
      connected: false,
      connecting: false,
      error: null,
      connect: mockConnect,
      disconnect: mockDisconnect,
      signTransaction: mockSignTransaction,
      walletType: null,
    };
  });

  describe("disconnected state", () => {
    it("renders Connect Wallet button", () => {
      render(<WalletConnect />);
      expect(screen.getByText(/Connect Wallet/i)).toBeInTheDocument();
    });

    it("button is enabled and clickable", () => {
      render(<WalletConnect />);
      const btn = screen.getByRole("button", { name: /Connect Wallet/i });
      expect(btn).toBeEnabled();
    });

    it("calls connect on click", () => {
      render(<WalletConnect />);
      fireEvent.click(screen.getByText(/Connect Wallet/i));
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe("connected state", () => {
    beforeEach(() => {
      walletState = {
        ...walletState,
        publicKey: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        connected: true,
      };
    });

    it("shows truncated address instead of Connect button", () => {
      render(<WalletConnect />);
      // truncateAddress: first 4 + "..." + last 4 = ST1P...GZGM
      expect(screen.getByText(/ST1P/)).toBeInTheDocument();
      expect(screen.queryByText(/Connect Wallet/i)).not.toBeInTheDocument();
    });

    it("opens dropdown on address click", () => {
      render(<WalletConnect />);
      const addrBtn = screen.getByText(/ST1P/);
      fireEvent.click(addrBtn);
      expect(screen.getByText("Copy Address")).toBeInTheDocument();
      expect(screen.getByText("Disconnect")).toBeInTheDocument();
    });

    it("calls disconnect when Disconnect is clicked", () => {
      render(<WalletConnect />);
      fireEvent.click(screen.getByText(/ST1P/));
      fireEvent.click(screen.getByText("Disconnect"));
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });
});
