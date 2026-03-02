// ── Network Configuration ─────────────────────────────────────────────────────

import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';

export const NETWORK_NAME: 'testnet' | 'mainnet' = 'testnet';
export const STACKS_API_URL = process.env.NEXT_PUBLIC_STACKS_API_URL || 'https://api.testnet.hiro.so';

export function getStacksNetwork() {
  return NETWORK_NAME === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
}

// ── Contract Addresses ────────────────────────────────────────────────────────
// Set via environment variables after deployment. Empty string = not deployed.

export const DEPLOYER_ADDRESS = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || '';
export const MARKET_CONTRACT_NAME = 'prediction-market';
export const TOKEN_CONTRACT_NAME = 'ipredict-token';
export const REFERRAL_CONTRACT_NAME = 'referral-registry';
export const LEADERBOARD_CONTRACT_NAME = 'leaderboard';

// ── Admin ─────────────────────────────────────────────────────────────────────

export const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS || '';

// ── Block Time ────────────────────────────────────────────────────────────────
// Average Stacks block time in seconds (~10 min on mainnet, varies on testnet).
// Used to estimate wall-clock time from block heights.

export const BLOCK_TIME_SECONDS = 600;

// ── Fee Model (basis points — BPS) ───────────────────────────────────────────
// 2% total fee deducted at bet time, split: 1.5% platform + 0.5% referrer

/** Total fee: 200 BPS = 2% */
export const TOTAL_FEE_BPS = 200;

/** Platform fee: 150 BPS = 1.5% — kept in AccumulatedFees */
export const PLATFORM_FEE_BPS = 150;

/** Referral fee: 50 BPS = 0.5% — sent to referrer if user has one */
export const REFERRAL_FEE_BPS = 50;

// ── Reward Constants ──────────────────────────────────────────────────────────

/** Bonus points a referrer earns per referred bet */
export const REFERRAL_BET_POINTS = 3;

/** Points awarded to a winning bettor */
export const WIN_POINTS = 30;

/** Points awarded to a losing bettor */
export const LOSE_POINTS = 10;

/** IPREDICT tokens awarded to a winning bettor (human-readable, 6 decimal) */
export const WIN_TOKENS = 10;

/** IPREDICT tokens awarded to a losing bettor (human-readable, 6 decimal) */
export const LOSE_TOKENS = 2;

/** Bonus points for registering via referral */
export const REGISTER_BONUS_POINTS = 5;

/** Bonus IPREDICT tokens for registering */
export const REGISTER_BONUS_TOKENS = 1;
