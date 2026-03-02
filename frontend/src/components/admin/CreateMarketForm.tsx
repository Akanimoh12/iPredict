"use client";

import React, { useState, useCallback } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/useToast";
import { createMarket } from "@/services/market";
import { FiPlusCircle, FiImage, FiClock, FiHelpCircle } from "react-icons/fi";
import Spinner from "@/components/ui/Spinner";
import TxProgress from "@/components/ui/TxProgress";
import type { TxStage } from "@/hooks/useClaim";

const DURATION_PRESETS = [
  { label: "1 Day", blocks: 17280 },
  { label: "3 Days", blocks: 51840 },
  { label: "1 Week", blocks: 120960 },
  { label: "1 Month", blocks: 518400 },
  { label: "3 Months", blocks: 1555200 },
];

export default function CreateMarketForm() {
  const { publicKey } = useWallet();
  const { showToast } = useToast();
  const [question, setQuestion] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [durationBlocks, setDurationBlocks] = useState(120960);
  const [customDuration, setCustomDuration] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [stage, setStage] = useState<TxStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const effectiveDuration = useCustom
    ? parseInt(customDuration, 10)
    : durationBlocks;

  const handleSubmit = useCallback(async () => {
    if (!publicKey || !question.trim()) return;
    if (!effectiveDuration || effectiveDuration <= 0) {
      setError("Duration must be positive");
      return;
    }

    setError(null);
    setSuccess(false);
    setStage("building");

    try {
      setStage("signing");
      const result = await createMarket(
        publicKey,
        question.trim(),
        imageUrl.trim() || "",
        effectiveDuration,
      );

      if (result.success) {
        setStage("confirmed");
        setSuccess(true);
        setQuestion("");
        setImageUrl("");
        showToast("Market created successfully!", "success");
        setTimeout(() => setStage("idle"), 3000);
      } else {
        setStage("failed");
        const msg = result.error || "Failed to create market";
        setError(msg);
        showToast(msg, "error");
      }
    } catch (err) {
      setStage("failed");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [publicKey, question, imageUrl, effectiveDuration]);

  const isSubmitting = stage !== "idle" && stage !== "confirmed" && stage !== "failed";

  return (
    <div className="card">
      <h3 className="font-heading font-semibold text-lg mb-5 flex items-center gap-2">
        <FiPlusCircle className="w-5 h-5 text-primary-400" />
        Create Market
      </h3>

      <div className="space-y-5">
        {/* Question */}
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-400 mb-1.5">
            <FiHelpCircle className="w-3.5 h-3.5" />
            Question
          </label>
          <textarea
            placeholder="Will Bitcoin reach $100K by end of 2025?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            maxLength={200}
            className="w-full px-4 py-3 rounded-xl bg-surface-hover border border-surface-border text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
          <span className="text-xs text-slate-600 mt-1 block text-right">
            {question.length}/200
          </span>
        </div>

        {/* Image URL */}
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-400 mb-1.5">
            <FiImage className="w-3.5 h-3.5" />
            Image URL <span className="text-slate-600">(optional)</span>
          </label>
          <input
            type="url"
            placeholder="https://example.com/market-image.png"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-surface-hover border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <FiClock className="w-3.5 h-3.5" />
            Duration
          </label>

          {/* Preset pills */}
          <div className="flex flex-wrap gap-2 mb-2">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.blocks}
                onClick={() => {
                  setUseCustom(false);
                  setDurationBlocks(preset.blocks);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !useCustom && durationBlocks === preset.blocks
                    ? "bg-primary-600 text-white"
                    : "bg-surface-hover text-slate-400 hover:text-white"
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={() => setUseCustom(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                useCustom
                  ? "bg-primary-600 text-white"
                  : "bg-surface-hover text-slate-400 hover:text-white"
              }`}
            >
              Custom
            </button>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            ~17,280 blocks &asymp; 1 day (at ~5s per block)
          </p>

          {useCustom && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="120960"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                min={1}
                className="w-32 px-3 py-2 rounded-xl bg-surface-hover border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
              <span className="text-sm text-slate-500">blocks</span>
            </div>
          )}
        </div>

        {/* Tx progress */}
        {stage !== "idle" && <TxProgress step={stage} />}

        {/* Error */}
        {error && (
          <p className="text-sm text-accent-red">{error}</p>
        )}

        {/* Success */}
        {success && stage === "confirmed" && (
          <p className="text-sm text-accent-green">Market created successfully!</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !question.trim() || !publicKey}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Spinner size="sm" />
          ) : (
            <FiPlusCircle className="w-4 h-4" />
          )}
          {isSubmitting ? "Creating..." : "Create Market"}
        </button>
      </div>
    </div>
  );
}
