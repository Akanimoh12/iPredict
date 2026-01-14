import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatUnits } from 'viem';
import type { Market, MarketStatus } from '@/types';

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format address to truncated form (0x1234...5678)
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Format INJ amount from wei
export function formatINJ(wei: bigint, decimals = 2): string {
  const value = formatUnits(wei, 18);
  return parseFloat(value).toFixed(decimals);
}

// Format large numbers with K, M, B suffixes
export function formatCompact(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

// Calculate time remaining
export function getTimeRemaining(endTime: bigint): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  isExpired: boolean;
} {
  const now = Math.floor(Date.now() / 1000);
  const end = Number(endTime);
  const total = end - now;

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isExpired: true };
  }

  return {
    days: Math.floor(total / (60 * 60 * 24)),
    hours: Math.floor((total % (60 * 60 * 24)) / (60 * 60)),
    minutes: Math.floor((total % (60 * 60)) / 60),
    seconds: total % 60,
    total,
    isExpired: false,
  };
}

// Format countdown string
export function formatCountdown(endTime: bigint): string {
  const { days, hours, minutes, isExpired } = getTimeRemaining(endTime);
  
  if (isExpired) return 'Ended';
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Get market status
export function getMarketStatus(market: Market): MarketStatus {
  if (market.cancelled) return 'cancelled';
  if (market.resolved) return market.outcome ? 'resolved-yes' : 'resolved-no';
  
  const { total, isExpired } = getTimeRemaining(market.endTime);
  if (isExpired) return 'ended';
  if (total < 3600) return 'ending-soon'; // Less than 1 hour
  return 'live';
}

// Calculate odds percentage
export function calculateOdds(yesAmount: bigint, noAmount: bigint): { yes: number; no: number } {
  const total = yesAmount + noAmount;
  if (total === BigInt(0)) return { yes: 50, no: 50 };
  
  const yesPercent = Number((yesAmount * BigInt(100)) / total);
  return { yes: yesPercent, no: 100 - yesPercent };
}

// Calculate potential return
export function calculatePotentialReturn(
  betAmount: bigint,
  isYes: boolean,
  totalYes: bigint,
  totalNo: bigint,
  platformFeeBps: number = 200
): bigint {
  const totalPool = totalYes + totalNo + betAmount;
  const winningPool = isYes ? totalYes + betAmount : totalNo + betAmount;
  
  if (winningPool === BigInt(0)) return BigInt(0);
  
  const grossReturn = (betAmount * totalPool) / winningPool;
  const fee = (grossReturn * BigInt(platformFeeBps)) / BigInt(10000);
  
  return grossReturn - fee;
}

// Format relative time
export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  
  return new Date(timestamp * 1000).toLocaleDateString();
}

// Get category icon name (for Lucide icons)
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Crypto: 'Bitcoin',
    Sports: 'Dumbbell',
    Politics: 'Landmark',
    Entertainment: 'Clapperboard',
    Tech: 'Cpu',
    Finance: 'LineChart',
  };
  return icons[category] || 'CircleDot';
}

// Generate explorer URL
export function getExplorerUrl(type: 'tx' | 'address', hash: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://testnet.blockscout.injective.network';
  return `${baseUrl}/${type === 'tx' ? 'tx' : 'address'}/${hash}`;
}
