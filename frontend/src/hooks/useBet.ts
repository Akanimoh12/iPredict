"use client";

import { useState, useCallback } from "react";
import { placeBet } from "@/services/market";
import { useWallet } from "@/hooks/useWallet";
import type { TransactionResult, AppError } from "@/types";

/**
 * Transaction lifecycle for Stacks:
 *   idle → building → signing (wallet popup open) → submitting (polling API) → confirmed / failed
 *
 * The market service's `placeBet` uses `openContractCall` which opens the
 * wallet popup.  Its internal `onFinish` callback receives the `txId` and
 * polls `GET ${STACKS_API_URL}/extended/v1/tx/${txId}` until the status is
 * "success" or "abort_by_response".  The hook wraps that single Promise with
 * stage tracking.
 */
export type TxStage =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "confirmed"
  | "failed";

interface UseBetResult {
  submit: (marketId: number, isYes: boolean, amount: number) => Promise<void>;
  result: TransactionResult | null;
  txId: string | null;
  loading: boolean;
  stage: TxStage;
  error: string | null;
  reset: () => void;
}

export function useBet(): UseBetResult {
  const { publicKey } = useWallet();
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<TxStage>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (marketId: number, isYes: boolean, amount: number) => {
      if (!publicKey) {
        setError("Wallet not connected");
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);
      setTxId(null);
      setStage("building");

      try {
        // openContractCall shows the wallet popup — stage transitions to signing
        setStage("signing");

        // placeBet opens the wallet for approval, then polls the Stacks API
        // for tx confirmation via waitForTx (signing + submitting in one call)
        const txResult = await placeBet(publicKey, marketId, isYes, amount);

        // Capture the txId from the result (available after confirmation)
        if (txResult.hash) {
          setTxId(txResult.hash);
        }

        if (txResult.success) {
          setStage("confirmed");
          setResult(txResult);
        } else {
          setStage("failed");
          setError(txResult.error || "Transaction failed");
          setResult(txResult);
        }
      } catch (err) {
        setStage("failed");
        console.error("[iPredict] useBet error:", err);
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [publicKey]
  );

  const reset = useCallback(() => {
    setResult(null);
    setTxId(null);
    setError(null);
    setStage("idle");
  }, []);

  return { submit, result, txId, loading, stage, error, reset };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractErrorMessage(err: unknown): string {
  if (isAppError(err)) {
    return err.details && err.details !== err.message
      ? `${err.message} — ${err.details}`
      : err.message;
  }
  if (err instanceof Error) return err.message;
  return String(err) || "Unknown error";
}

function isAppError(err: unknown): err is AppError {
  return (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    "message" in err
  );
}
