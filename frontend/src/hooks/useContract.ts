// Custom hooks for iPredict contract interactions
'use client';

import { useCallback, useState, useEffect } from 'react';
import { 
  useReadContract, 
  useWriteContract, 
  useWatchContractEvent,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import type { Market, Bet, UserStats, MarketWithOdds } from '@/types';
import type { Log, Hash } from 'viem';

// ============================================
// Types for hook returns
// ============================================

export interface ContractReadResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface ContractMutationResult {
  isLoading: boolean;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  txHash: Hash | undefined;
  reset: () => void;
}

export interface BetPlacedEvent {
  marketId: bigint;
  user: `0x${string}`;
  amount: bigint;
  isYes: boolean;
  timestamp: bigint;
  txHash: Hash;
}

export interface WinningsClaimedEvent {
  marketId: bigint;
  user: `0x${string}`;
  amount: bigint;
  points: bigint;
  txHash: Hash;
}

// ============================================
// Read Hooks
// ============================================

// Fetch market count
export function useMarketCount() {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'marketCount',
    query: {
      refetchInterval: 30000, // Refresh every 30 seconds
    },
  });

  return {
    count: result.data as bigint | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
}

// Fetch paginated list of markets with polling every 10 seconds
export function useMarkets(offset: number = 0, limit: number = 10) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getMarkets',
    args: [BigInt(offset), BigInt(limit)],
    query: {
      refetchInterval: 10000, // Poll every 10 seconds
      staleTime: 5000, // Consider data stale after 5 seconds
    },
  });

  // Transform data to include odds
  const markets = result.data as Market[] | undefined;
  const marketsWithOdds: MarketWithOdds[] | undefined = markets?.map((market) => {
    const total = market.totalYesBets + market.totalNoBets;
    const yesPercent = total > 0 
      ? Number((market.totalYesBets * BigInt(100)) / total) 
      : 50;
    return {
      ...market,
      yesPercent,
      noPercent: 100 - yesPercent,
      totalPool: total,
    };
  });

  return {
    markets: marketsWithOdds,
    rawMarkets: markets,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
    isFetching: result.isFetching,
  };
}

// Fetch single market by ID with real-time updates
export function useMarket(marketId: bigint | undefined) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getMarket',
    args: marketId !== undefined ? [marketId] : undefined,
    query: {
      enabled: marketId !== undefined,
      refetchInterval: 5000, // More frequent updates for single market
      staleTime: 2000,
    },
  });

  const market = result.data as Market | undefined;
  
  // Calculate odds for the market
  const marketWithOdds: MarketWithOdds | undefined = market ? (() => {
    const total = market.totalYesBets + market.totalNoBets;
    const yesPercent = total > 0 
      ? Number((market.totalYesBets * BigInt(100)) / total) 
      : 50;
    return {
      ...market,
      yesPercent,
      noPercent: 100 - yesPercent,
      totalPool: total,
    };
  })() : undefined;

  return {
    market: marketWithOdds,
    rawMarket: market,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
    isFetching: result.isFetching,
  };
}

// Get YES/NO percentages for a market
export function useMarketOdds(marketId: bigint | undefined) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getMarketOdds',
    args: marketId !== undefined ? [marketId] : undefined,
    query: {
      enabled: marketId !== undefined,
      refetchInterval: 5000,
      staleTime: 2000,
    },
  });

  const odds = result.data as readonly [bigint, bigint] | undefined;

  return {
    yesPercent: odds ? Number(odds[0]) : undefined,
    noPercent: odds ? Number(odds[1]) : undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
}

// Get user's bet on a specific market
export function useUserBet(marketId: bigint | undefined, userAddress: `0x${string}` | undefined) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserBet',
    args: marketId !== undefined && userAddress ? [marketId, userAddress] : undefined,
    query: {
      enabled: marketId !== undefined && !!userAddress,
      staleTime: 10000,
    },
  });

  const bet = result.data as Bet | undefined;
  const hasBet = bet ? bet.amount > BigInt(0) : false;

  return {
    bet,
    hasBet,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
}

// Get user's points and stats
export function useUserStats(userAddress: `0x${string}` | undefined) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserStats',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
      staleTime: 30000,
    },
  });

  const stats = result.data as UserStats | undefined;

  // Calculate win rate
  const winRate = stats && stats.totalBets > 0
    ? Number((stats.correctBets * BigInt(100)) / stats.totalBets)
    : 0;

  return {
    stats,
    winRate,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
}

// Fetch user's market IDs
export function useUserMarkets(userAddress: `0x${string}` | undefined) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserMarkets',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    marketIds: result.data as bigint[] | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
}

// Fetch user's claimable markets
export function useClaimableMarkets(userAddress: `0x${string}` | undefined) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getClaimableMarkets',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
      refetchInterval: 30000,
    },
  });

  return {
    claimableMarketIds: result.data as bigint[] | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
}

// Calculate potential winnings
export function useCalculateWinnings(marketId: bigint | undefined, userAddress: `0x${string}` | undefined) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'calculateWinnings',
    args: marketId !== undefined && userAddress ? [marketId, userAddress] : undefined,
    query: {
      enabled: marketId !== undefined && !!userAddress,
      refetchInterval: 10000,
    },
  });

  return {
    winnings: result.data as bigint | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
}

// ============================================
// Write Hooks (Mutations)
// ============================================

// Place bet mutation hook with optimistic updates
export function usePlaceBet() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, isError, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Optimistic update callback
  const [optimisticBet, setOptimisticBet] = useState<{
    marketId: bigint;
    amount: bigint;
    isYes: boolean;
  } | null>(null);

  const placeBet = useCallback(async (
    marketId: bigint, 
    isYes: boolean, 
    amount: bigint,
    onOptimisticUpdate?: () => void
  ) => {
    // Set optimistic state
    setOptimisticBet({ marketId, amount, isYes });
    onOptimisticUpdate?.();

    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'placeBet',
        args: [marketId, isYes],
        value: amount,
      });
    } catch (err) {
      // Clear optimistic state on error
      setOptimisticBet(null);
      throw err;
    }
  }, [writeContract]);

  // Invalidate queries on success
  useEffect(() => {
    if (isSuccess && optimisticBet) {
      // Invalidate market data to refetch
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
      setOptimisticBet(null);
    }
  }, [isSuccess, optimisticBet, queryClient]);

  // Clear optimistic state on error
  useEffect(() => {
    if (isError) {
      setOptimisticBet(null);
    }
  }, [isError]);

  return { 
    placeBet, 
    txHash: hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    optimisticBet,
    reset: useCallback(() => {
      reset();
      setOptimisticBet(null);
    }, [reset]),
  };
}

// Claim winnings mutation hook
export function useClaimWinnings() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, isError, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimWinnings = useCallback(async (marketId: bigint) => {
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'claimWinnings',
      args: [marketId],
    });
  }, [writeContract]);

  // Invalidate queries on success
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
    }
  }, [isSuccess, queryClient]);

  return { 
    claimWinnings, 
    txHash: hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    reset,
  };
}

// Claim refund mutation hook
export function useClaimRefund() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, isError, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRefund = useCallback(async (marketId: bigint) => {
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'claimRefund',
      args: [marketId],
    });
  }, [writeContract]);

  // Invalidate queries on success
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
    }
  }, [isSuccess, queryClient]);

  return { 
    claimRefund, 
    txHash: hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    reset,
  };
}

// Batch claim mutation hook
export function useBatchClaim() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, isError, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const batchClaim = useCallback(async (marketIds: bigint[]) => {
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'batchClaim',
      args: [marketIds],
    });
  }, [writeContract]);

  // Invalidate queries on success
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
    }
  }, [isSuccess, queryClient]);

  return { 
    batchClaim, 
    txHash: hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    reset,
  };
}

// ============================================
// Event Hooks
// ============================================

// Watch BetPlaced events
export function useBetPlacedEvents(
  onEvent?: (event: BetPlacedEvent) => void,
  marketId?: bigint // Optional filter by market
) {
  return useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'BetPlaced',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const args = (log as Log & { args: Record<string, unknown> }).args;
        const event: BetPlacedEvent = {
          marketId: args.marketId as bigint,
          user: args.user as `0x${string}`,
          amount: args.amount as bigint,
          isYes: args.isYes as boolean,
          timestamp: args.timestamp as bigint,
          txHash: log.transactionHash as Hash,
        };
        
        // Filter by marketId if provided
        if (marketId === undefined || event.marketId === marketId) {
          onEvent?.(event);
        }
      });
    },
  });
}

// Watch WinningsClaimed events
export function useWinningsClaimedEvents(
  onEvent?: (event: WinningsClaimedEvent) => void,
  marketId?: bigint // Optional filter by market
) {
  return useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'WinningsClaimed',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const args = (log as Log & { args: Record<string, unknown> }).args;
        const event: WinningsClaimedEvent = {
          marketId: args.marketId as bigint,
          user: args.user as `0x${string}`,
          amount: args.amount as bigint,
          points: args.points as bigint,
          txHash: log.transactionHash as Hash,
        };
        
        // Filter by marketId if provided
        if (marketId === undefined || event.marketId === marketId) {
          onEvent?.(event);
        }
      });
    },
  });
}

// Combined contract events hook - subscribe to both BetPlaced and WinningsClaimed
export function useContractEvents(callbacks?: {
  onBetPlaced?: (event: BetPlacedEvent) => void;
  onWinningsClaimed?: (event: WinningsClaimedEvent) => void;
}, marketId?: bigint) {
  useBetPlacedEvents(callbacks?.onBetPlaced, marketId);
  useWinningsClaimedEvents(callbacks?.onWinningsClaimed, marketId);
}

// ============================================
// Compound Hooks (combining multiple reads)
// ============================================

// Get complete user profile data
export function useUserProfile(userAddress: `0x${string}` | undefined) {
  const { stats, winRate, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useUserStats(userAddress);
  const { marketIds, isLoading: marketsLoading, error: marketsError, refetch: refetchMarkets } = useUserMarkets(userAddress);
  const { claimableMarketIds, isLoading: claimableLoading, error: claimableError, refetch: refetchClaimable } = useClaimableMarkets(userAddress);

  return {
    stats,
    winRate,
    marketIds,
    claimableMarketIds,
    hasClaimable: claimableMarketIds && claimableMarketIds.length > 0,
    isLoading: statsLoading || marketsLoading || claimableLoading,
    isError: !!statsError || !!marketsError || !!claimableError,
    refetch: () => {
      refetchStats();
      refetchMarkets();
      refetchClaimable();
    },
  };
}

// Get market with user's bet info
export function useMarketWithUserBet(marketId: bigint | undefined, userAddress: `0x${string}` | undefined) {
  const { market, isLoading: marketLoading, error: marketError, refetch: refetchMarket } = useMarket(marketId);
  const { bet, hasBet, isLoading: betLoading, error: betError, refetch: refetchBet } = useUserBet(marketId, userAddress);
  const { winnings, isLoading: winningsLoading, refetch: refetchWinnings } = useCalculateWinnings(marketId, userAddress);

  return {
    market,
    userBet: bet,
    hasBet,
    potentialWinnings: winnings,
    isLoading: marketLoading || betLoading || winningsLoading,
    isError: !!marketError || !!betError,
    refetch: () => {
      refetchMarket();
      refetchBet();
      refetchWinnings();
    },
  };
}

// ============================================
// Platform Stats Hook
// ============================================

export function usePlatformStats() {
  const { count: marketCount, isLoading: countLoading } = useMarketCount();
  const { markets, isLoading: marketsLoading } = useMarkets(0, 100); // Get all markets for stats

  // Calculate platform stats
  const totalVolume = markets?.reduce((sum, m) => sum + m.totalPool, BigInt(0)) ?? BigInt(0);
  const activeMarkets = markets?.filter(m => !m.resolved && !m.cancelled).length ?? 0;
  const resolvedMarkets = markets?.filter(m => m.resolved).length ?? 0;

  // Estimate unique users from market data (simplified)
  const uniqueUsers = markets?.reduce((sum, m) => sum + Number(m.yesCount) + Number(m.noCount), 0) ?? 0;

  return {
    totalVolume,
    totalMarkets: marketCount ? Number(marketCount) : 0,
    activeMarkets,
    resolvedMarkets,
    estimatedUsers: Math.floor(uniqueUsers / 2), // Rough estimate
    isLoading: countLoading || marketsLoading,
  };
}

// ============================================
// Admin Hooks
// ============================================

// Get contract admin address
export function useAdmin() {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'admin',
    query: {
      staleTime: 60000, // Cache for 1 minute
    },
  });

  return {
    admin: result.data as `0x${string}` | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
  };
}

// Get platform fee
export function usePlatformFee() {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'platformFee',
  });

  return {
    fee: result.data as bigint | undefined,
    feePercent: result.data ? Number(result.data) / 100 : undefined,
    isLoading: result.isLoading,
  };
}

// Get accumulated fees
export function useAccumulatedFees() {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'accumulatedFees',
    query: {
      refetchInterval: 30000,
    },
  });

  return {
    fees: result.data as bigint | undefined,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}

// Get paused state
export function usePausedState() {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'paused',
    query: {
      refetchInterval: 10000,
    },
  });

  return {
    isPaused: result.data as boolean | undefined,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}

// Get pending markets (ended but not resolved)
export function usePendingMarkets() {
  const { markets, isLoading, refetch } = useMarkets(0, 100);
  
  const pendingMarkets = markets?.filter(market => {
    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(market.endTime);
    return endTime < now && !market.resolved && !market.cancelled;
  });

  return {
    pendingMarkets,
    isLoading,
    refetch,
  };
}

// Create market mutation hook
export function useCreateMarket() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, isError, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createMarket = useCallback(async (
    question: string,
    imageUrl: string,
    category: string,
    duration: bigint
  ) => {
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'createMarket',
      args: [question, imageUrl, category, duration],
    });
  }, [writeContract]);

  // Invalidate queries on success
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
    }
  }, [isSuccess, queryClient]);

  return { 
    createMarket, 
    txHash: hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    reset,
  };
}

// Resolve market mutation hook
export function useResolveMarket() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, isError, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const resolveMarket = useCallback(async (marketId: bigint, outcome: boolean) => {
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'resolveMarket',
      args: [marketId, outcome],
    });
  }, [writeContract]);

  // Invalidate queries on success
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
    }
  }, [isSuccess, queryClient]);

  return { 
    resolveMarket, 
    txHash: hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    reset,
  };
}

// Cancel market mutation hook
export function useCancelMarket() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, isError, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelMarket = useCallback(async (marketId: bigint) => {
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'cancelMarket',
      args: [marketId],
    });
  }, [writeContract]);

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
    }
  }, [isSuccess, queryClient]);

  return { 
    cancelMarket, 
    txHash: hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    reset,
  };
}

// Withdraw fees mutation hook
export function useWithdrawFees() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, isError, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdrawFees = useCallback(async () => {
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'withdrawFees',
      args: [],
    });
  }, [writeContract]);

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
    }
  }, [isSuccess, queryClient]);

  return { 
    withdrawFees, 
    txHash: hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    reset,
  };
}

// Pause/unpause mutation hooks
export function usePause() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, isError, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const pause = useCallback(async () => {
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'pause',
      args: [],
    });
  }, [writeContract]);

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
    }
  }, [isSuccess, queryClient]);

  return { pause, txHash: hash, isPending, isConfirming, isSuccess, isError, error, reset };
}

export function useUnpause() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, isError, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const unpause = useCallback(async () => {
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'unpause',
      args: [],
    });
  }, [writeContract]);

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
    }
  }, [isSuccess, queryClient]);

  return { unpause, txHash: hash, isPending, isConfirming, isSuccess, isError, error, reset };
}
