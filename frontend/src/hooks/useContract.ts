// Custom hooks for iPredict contract interactions
'use client';

import { useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import type { Market, Bet, UserStats } from '@/types';

// Fetch market count
export function useMarketCount() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'marketCount',
  });
}

// Fetch paginated markets
export function useMarkets(offset: number = 0, limit: number = 10) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getMarkets',
    args: [BigInt(offset), BigInt(limit)],
    query: {
      refetchInterval: 10000, // Poll every 10 seconds
    },
  });
}

// Fetch single market by ID
export function useMarket(marketId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getMarket',
    args: marketId !== undefined ? [marketId] : undefined,
    query: {
      enabled: marketId !== undefined,
      refetchInterval: 5000, // More frequent updates for single market
    },
  });
}

// Fetch market odds
export function useMarketOdds(marketId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getMarketOdds',
    args: marketId !== undefined ? [marketId] : undefined,
    query: {
      enabled: marketId !== undefined,
      refetchInterval: 5000,
    },
  });
}

// Fetch user's bet on a specific market
export function useUserBet(marketId: bigint | undefined, userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserBet',
    args: marketId !== undefined && userAddress ? [marketId, userAddress] : undefined,
    query: {
      enabled: marketId !== undefined && !!userAddress,
    },
  });
}

// Fetch user stats
export function useUserStats(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserStats',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

// Fetch user's market IDs
export function useUserMarkets(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserMarkets',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

// Fetch user's claimable markets
export function useClaimableMarkets(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getClaimableMarkets',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

// Calculate potential winnings
export function useCalculateWinnings(marketId: bigint | undefined, userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'calculateWinnings',
    args: marketId !== undefined && userAddress ? [marketId, userAddress] : undefined,
    query: {
      enabled: marketId !== undefined && !!userAddress,
    },
  });
}

// Place bet mutation
export function usePlaceBet() {
  const queryClient = useQueryClient();
  const { writeContract, ...rest } = useWriteContract();

  const placeBet = async (marketId: bigint, isYes: boolean, amount: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'placeBet',
      args: [marketId, isYes],
      value: amount,
    });
  };

  return { placeBet, ...rest };
}

// Claim winnings mutation
export function useClaimWinnings() {
  const { writeContract, ...rest } = useWriteContract();

  const claimWinnings = async (marketId: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'claimWinnings',
      args: [marketId],
    });
  };

  return { claimWinnings, ...rest };
}

// Claim refund mutation
export function useClaimRefund() {
  const { writeContract, ...rest } = useWriteContract();

  const claimRefund = async (marketId: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'claimRefund',
      args: [marketId],
    });
  };

  return { claimRefund, ...rest };
}

// Batch claim mutation
export function useBatchClaim() {
  const { writeContract, ...rest } = useWriteContract();

  const batchClaim = async (marketIds: bigint[]) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'batchClaim',
      args: [marketIds],
    });
  };

  return { batchClaim, ...rest };
}

// Watch BetPlaced events
export function useBetPlacedEvents(onEvent?: (log: any) => void) {
  return useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'BetPlaced',
    onLogs: (logs) => {
      logs.forEach((log) => onEvent?.(log));
    },
  });
}

// Watch WinningsClaimed events
export function useWinningsClaimedEvents(onEvent?: (log: any) => void) {
  return useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'WinningsClaimed',
    onLogs: (logs) => {
      logs.forEach((log) => onEvent?.(log));
    },
  });
}
