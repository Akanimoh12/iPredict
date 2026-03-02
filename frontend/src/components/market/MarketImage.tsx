"use client";

import React, { useState } from "react";
import Image from "next/image";

const FALLBACK = "/images/markets/default-market.svg";

/** Map common keywords in market questions to local seed images */
const KEYWORD_IMAGES: Record<string, string> = {
  bitcoin: "/images/markets/btc.png",
  btc: "/images/markets/btc.png",
  stx: "/images/markets/stx.png",
  stacks: "/images/markets/stx.png",
  ethereum: "/images/markets/eth.png",
  eth: "/images/markets/eth.png",
  solana: "/images/markets/sol.png",
  sol: "/images/markets/sol.png",
};

/** Pick a seed image based on the alt text (market question) */
function pickSeedImage(alt: string): string {
  const lower = alt.toLowerCase();
  for (const [keyword, path] of Object.entries(KEYWORD_IMAGES)) {
    if (lower.includes(keyword)) return path;
  }
  return FALLBACK;
}

interface MarketImageProps {
  src?: string;
  alt: string;
  className?: string;
  rounded?: "top" | "all";
}

export default function MarketImage({
  src,
  alt,
  className = "",
  rounded = "all",
}: MarketImageProps) {
  const effectiveSrc = src && src.trim().length > 0 ? src : pickSeedImage(alt);
  const [imgSrc, setImgSrc] = useState(effectiveSrc);
  const [failed, setFailed] = useState(false);

  const roundedClass =
    rounded === "top" ? "rounded-t-2xl" : "rounded-xl";

  // If image loading failed, show a CSS gradient fallback
  if (failed) {
    return (
      <div
        className={`relative w-full aspect-video overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center ${roundedClass} ${className}`}
      >
        <div className="text-center opacity-60">
          <svg
            className="w-12 h-12 mx-auto mb-2 text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
          <p className="text-xs text-slate-500 px-4 line-clamp-2">{alt}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full aspect-video overflow-hidden bg-surface-hover ${roundedClass} ${className}`}
    >
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
        loading="lazy"
        onError={() => {
          if (imgSrc !== FALLBACK) {
            setImgSrc(FALLBACK);
          } else {
            setFailed(true);
          }
        }}
      />
    </div>
  );
}
