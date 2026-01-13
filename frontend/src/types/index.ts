// iPredict TypeScript Type Definitions

// Market struct matching the smart contract
export interface Market {
  id: bigint;
  question: string;
  imageUrl: string;
  category: string;
  endTime: bigint;
  totalYesBets: bigint;
  totalNoBets: bigint;
  yesCount: bigint;
  noCount: bigint;
  resolved: boolean;
  outcome: boolean;
  cancelled: boolean;
  creator: `0x${string}`;
  createdAt: bigint;
}

// Bet struct matching the smart contract
export interface Bet {
  amount: bigint;
  isYes: boolean;
  claimed: boolean;
  timestamp: bigint;
}

// UserStats struct matching the smart contract
export interface UserStats {
  totalPoints: bigint;
  totalBets: bigint;
  correctBets: bigint;
  totalWinnings: bigint;
}

// Frontend-specific types
export interface MarketWithOdds extends Market {
  yesPercent: number;
  noPercent: number;
  totalPool: bigint;
}

export interface ActivityItem {
  type: 'bet' | 'claim' | 'market_created' | 'market_resolved';
  marketId: bigint;
  user: `0x${string}`;
  amount: bigint;
  isYes?: boolean;
  timestamp: number;
  txHash: `0x${string}`;
}

export interface LeaderboardEntry {
  rank: number;
  address: `0x${string}`;
  stats: UserStats;
}

// Market status for UI display
export type MarketStatus = 
  | 'live' 
  | 'ending-soon' 
  | 'ended' 
  | 'resolved-yes' 
  | 'resolved-no' 
  | 'cancelled';

// Category definitions
export const CATEGORIES = [
  'All',
  'Crypto',
  'Sports',
  'Politics',
  'Entertainment',
  'Tech',
  'Finance',
] as const;

export type Category = typeof CATEGORIES[number];

// Filter and sort options
export type MarketFilter = 'all' | 'live' | 'ending-soon' | 'resolved';
export type MarketSort = 'trending' | 'volume' | 'newest' | 'ending-soon';
