'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { parseEther, formatUnits } from 'viem';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  TrendingDown,
  Rocket,
  Wallet,
  AlertCircle,
  Trophy,
  Gift,
  RefreshCw,
  CheckCircle,
  XCircle,
  PartyPopper,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePlaceBet, useClaimWinnings, useUserBet, useCalculateWinnings, useBetPlacedEvents, BetPlacedEvent } from '@/hooks/useContract';
import { cn, formatINJ, calculatePotentialReturn, getMarketStatus, getExplorerUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { MarketWithOdds } from '@/types';

// Confetti celebration function
const triggerConfetti = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // Fire multiple bursts
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
};

interface BettingPanelProps {
  market: MarketWithOdds;
  className?: string;
  onBetPlaced?: () => void; // Callback to notify parent of bet placement
}

const QUICK_AMOUNTS = [0.05, 0.1, 0.25, 0.5];
const MIN_BET = 0.01;

export function BettingPanel({ market, className, onBetPlaced }: BettingPanelProps) {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { toast, dismiss } = useToast();
  const pendingToastIdRef = useRef<string | null>(null);

  // Contract hooks
  const { bet, hasBet, refetch: refetchBet } = useUserBet(market.id, address);
  const { winnings, refetch: refetchWinnings } = useCalculateWinnings(market.id, address);
  const { 
    placeBet, 
    txHash,
    isPending, 
    isConfirming, 
    isSuccess: betSuccess, 
    isError: betError, 
    error: betErrorDetails,
    reset: resetBet 
  } = usePlaceBet();
  const { 
    claimWinnings, 
    txHash: claimTxHash,
    isPending: claimPending, 
    isConfirming: claimConfirming, 
    isSuccess: claimSuccess,
    isError: claimError,
    error: claimErrorDetails,
    reset: resetClaim
  } = useClaimWinnings();

  // Subscribe to bet events for real-time updates
  const handleBetEvent = useCallback((event: BetPlacedEvent) => {
    // Only notify if the bet isn't from us
    if (event.user.toLowerCase() !== address?.toLowerCase()) {
      toast({
        title: 'New Prediction!',
        description: `Someone just bet ${formatINJ(event.amount)} INJ on ${event.isYes ? 'YES' : 'NO'}`,
        duration: 3000,
      });
      // Trigger a refetch of bet data to update odds
      refetchBet();
    }
  }, [address, toast, refetchBet]);
  
  useBetPlacedEvents(handleBetEvent, market.id);

  // Local state
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no' | null>(null);
  const [amount, setAmount] = useState<string>('');

  // Derived state
  const marketStatus = getMarketStatus(market);
  const balance = balanceData ? parseFloat(formatUnits(balanceData.value, 18)) : 0;
  const betAmount = parseFloat(amount) || 0;
  const betAmountWei = amount ? parseEther(amount) : BigInt(0);

  // Calculate potential return
  const potentialReturn = useMemo(() => {
    if (!selectedSide || !betAmountWei || betAmountWei === BigInt(0)) return BigInt(0);
    return calculatePotentialReturn(
      betAmountWei,
      selectedSide === 'yes',
      market.totalYesBets,
      market.totalNoBets
    );
  }, [selectedSide, betAmountWei, market.totalYesBets, market.totalNoBets]);

  const profitPercentage = useMemo(() => {
    if (betAmountWei === BigInt(0) || potentialReturn === BigInt(0)) return 0;
    const profit = potentialReturn - betAmountWei;
    return Number((profit * BigInt(100)) / betAmountWei);
  }, [betAmountWei, potentialReturn]);

  // Show pending toast when transaction is submitted
  useEffect(() => {
    if (isPending && txHash) {
      const toastResult = toast({
        title: 'Transaction Pending',
        description: (
          <div className="flex flex-col gap-2">
            <p>Your prediction is being confirmed...</p>
            <a 
              href={getExplorerUrl('tx', txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 text-sm"
            >
              View on Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ),
        duration: 60000, // Keep open until dismissed
      });
      pendingToastIdRef.current = toastResult.id;
    }
  }, [isPending, txHash, toast]);

  // Handle bet success with confetti and transaction link
  useEffect(() => {
    if (betSuccess && txHash) {
      // Dismiss pending toast
      if (pendingToastIdRef.current) {
        dismiss(pendingToastIdRef.current);
        pendingToastIdRef.current = null;
      }
      
      // Trigger confetti celebration
      triggerConfetti();
      
      // Show success toast with transaction link
      toast({
        title: '🎉 Prediction Placed!',
        description: (
          <div className="flex flex-col gap-2">
            <p>You predicted {selectedSide?.toUpperCase()} with {amount} INJ</p>
            <a 
              href={getExplorerUrl('tx', txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 text-sm"
            >
              View Transaction <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ),
      });
      
      // Clear form and refresh data
      setSelectedSide(null);
      setAmount('');
      refetchBet();
      onBetPlaced?.();
      
      // Reset after showing success
      setTimeout(() => resetBet(), 3000);
    }
  }, [betSuccess, txHash, selectedSide, amount, toast, dismiss, refetchBet, resetBet, onBetPlaced]);

  // Handle bet error
  useEffect(() => {
    if (betError && betErrorDetails) {
      // Dismiss pending toast
      if (pendingToastIdRef.current) {
        dismiss(pendingToastIdRef.current);
        pendingToastIdRef.current = null;
      }
      
      // Parse error message for better UX
      let errorMessage = betErrorDetails.message || 'Failed to place prediction';
      if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for this transaction';
      } else if (errorMessage.includes('user rejected') || errorMessage.includes('User denied')) {
        errorMessage = 'Transaction was rejected';
      } else if (errorMessage.includes('network')) {
        errorMessage = 'Network error - please try again';
      }
      
      toast({
        title: 'Transaction Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [betError, betErrorDetails, toast, dismiss]);

  // Handle claim success with confetti
  useEffect(() => {
    if (claimSuccess && claimTxHash) {
      // Trigger confetti for claim too
      triggerConfetti();
      
      toast({
        title: '🎊 Winnings Claimed!',
        description: (
          <div className="flex flex-col gap-2">
            <p>Your winnings have been sent to your wallet</p>
            <a 
              href={getExplorerUrl('tx', claimTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 text-sm"
            >
              View Transaction <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ),
      });
      refetchBet();
      refetchWinnings();
      setTimeout(() => resetClaim(), 3000);
    }
  }, [claimSuccess, claimTxHash, toast, refetchBet, refetchWinnings, resetClaim]);

  // Handle claim error
  useEffect(() => {
    if (claimError && claimErrorDetails) {
      toast({
        title: 'Claim Failed',
        description: claimErrorDetails.message || 'Failed to claim winnings',
        variant: 'destructive',
      });
    }
  }, [claimError, claimErrorDetails, toast]);

  // Handle place bet with validation
  const handlePlaceBet = useCallback(async () => {
    if (!selectedSide || !amount || betAmount < MIN_BET) {
      toast({
        title: 'Invalid Amount',
        description: `Minimum bet is ${MIN_BET} INJ`,
        variant: 'destructive',
      });
      return;
    }
    if (betAmount > balance) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ${betAmount.toFixed(4)} INJ but only have ${balance.toFixed(4)} INJ`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await placeBet(market.id, selectedSide === 'yes', betAmountWei);
    } catch (err) {
      console.error('Place bet error:', err);
    }
  }, [selectedSide, amount, betAmount, balance, market.id, betAmountWei, placeBet, toast]);

  // Handle claim
  const handleClaim = async () => {
    try {
      await claimWinnings(market.id);
    } catch (err) {
      console.error('Claim error:', err);
    }
  };

  // Set max amount
  const setMaxAmount = () => {
    const maxBet = Math.max(0, balance - 0.01); // Leave some for gas
    setAmount(maxBet.toFixed(4));
  };

  // Not connected state
  if (!isConnected) {
    return (
      <Card className={cn('glass', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect to Predict
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <p className="text-muted-foreground text-center">
            Connect your wallet to place predictions on this market
          </p>
          <ConnectButton />
        </CardContent>
      </Card>
    );
  }

  // Market cancelled - show refund
  if (marketStatus === 'cancelled') {
    return (
      <Card className={cn('glass', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <XCircle className="h-5 w-5" />
            Market Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center py-4">
            This market has been cancelled. If you placed a bet, you can claim a refund.
          </p>
          {hasBet && bet && (
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground mb-2">Your bet:</p>
              <p className="font-medium">{formatINJ(bet.amount)} INJ on {bet.isYes ? 'YES' : 'NO'}</p>
            </div>
          )}
          {hasBet && (
            <Button 
              className="w-full" 
              onClick={handleClaim}
              disabled={claimPending || claimConfirming}
            >
              {claimPending || claimConfirming ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Claiming Refund...
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Claim Refund
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Market resolved - show results
  if (marketStatus === 'resolved-yes' || marketStatus === 'resolved-no') {
    const userWon = hasBet && bet && ((market.outcome && bet.isYes) || (!market.outcome && !bet.isYes));
    const canClaim = userWon && !bet?.claimed && winnings && winnings > BigInt(0);

    return (
      <Card className={cn('glass', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {market.outcome ? (
              <Badge className="bg-yes text-white">Resolved YES</Badge>
            ) : (
              <Badge className="bg-no text-white">Resolved NO</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Outcome celebration */}
          {userWon && !bet?.claimed && (
            <div className="p-6 rounded-lg bg-gradient-to-br from-yes/20 to-yes/5 border border-yes/30 text-center">
              <PartyPopper className="h-12 w-12 text-yes mx-auto mb-3" />
              <h3 className="text-xl font-bold text-yes">Congratulations!</h3>
              <p className="text-muted-foreground mt-1">Your prediction was correct!</p>
              {winnings && (
                <p className="text-2xl font-bold mt-3">{formatINJ(winnings)} INJ</p>
              )}
            </div>
          )}

          {/* User lost */}
          {hasBet && bet && !userWon && (
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-muted-foreground">Your prediction was incorrect</p>
              <p className="text-sm mt-2">
                You bet {formatINJ(bet.amount)} INJ on {bet.isYes ? 'YES' : 'NO'}
              </p>
            </div>
          )}

          {/* Already claimed */}
          {hasBet && bet?.claimed && (
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <CheckCircle className="h-8 w-8 text-yes mx-auto mb-2" />
              <p className="text-muted-foreground">Winnings already claimed</p>
            </div>
          )}

          {/* No bet placed */}
          {!hasBet && (
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-muted-foreground">You didn&apos;t participate in this market</p>
            </div>
          )}

          {/* Claim button */}
          {canClaim && (
            <Button 
              className="w-full gradient-injective" 
              size="lg"
              onClick={handleClaim}
              disabled={claimPending || claimConfirming}
            >
              {claimPending || claimConfirming ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4 mr-2" />
                  Claim {formatINJ(winnings!)} INJ
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Market ended but not resolved
  if (marketStatus === 'ended') {
    return (
      <Card className={cn('glass', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-5 w-5" />
            Awaiting Resolution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center py-4">
            This market has ended and is awaiting resolution by the oracle.
          </p>
          {hasBet && bet && (
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground mb-2">Your prediction:</p>
              <div className="flex items-center justify-between">
                <Badge className={cn(
                  bet.isYes ? 'bg-yes text-white' : 'bg-no text-white'
                )}>
                  {bet.isYes ? 'YES' : 'NO'}
                </Badge>
                <span className="font-medium">{formatINJ(bet.amount)} INJ</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // User already bet
  if (hasBet && bet) {
    return (
      <Card className={cn('glass', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-yes" />
            Prediction Placed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground">Your prediction</span>
              <Badge className={cn(
                'text-lg px-4 py-1',
                bet.isYes ? 'bg-yes text-white' : 'bg-no text-white'
              )}>
                {bet.isYes ? 'YES' : 'NO'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-bold text-lg">{formatINJ(bet.amount)} INJ</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
            <AlertCircle className="h-3 w-3" />
            You can only place one bet per market
          </p>
        </CardContent>
      </Card>
    );
  }

  // Active betting panel
  return (
    <Card className={cn('glass', className)}>
      <CardHeader>
        <CardTitle>Your Prediction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* YES/NO Toggle */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={selectedSide === 'yes' ? 'default' : 'outline'}
            className={cn(
              'h-16 text-lg transition-all',
              selectedSide === 'yes' && 'bg-yes hover:bg-yes/90 border-yes glow-yes'
            )}
            onClick={() => setSelectedSide('yes')}
          >
            <TrendingUp className="h-5 w-5 mr-2" />
            YES
            <span className="ml-2 text-sm opacity-80">{market.yesPercent}%</span>
          </Button>
          <Button
            variant={selectedSide === 'no' ? 'default' : 'outline'}
            className={cn(
              'h-16 text-lg transition-all',
              selectedSide === 'no' && 'bg-no hover:bg-no/90 border-no glow-no'
            )}
            onClick={() => setSelectedSide('no')}
          >
            <TrendingDown className="h-5 w-5 mr-2" />
            NO
            <span className="ml-2 text-sm opacity-80">{market.noPercent}%</span>
          </Button>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount (INJ)</span>
            <button 
              className="text-primary hover:underline"
              onClick={setMaxAmount}
            >
              Balance: {balance.toFixed(4)} INJ
            </button>
          </div>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-16 text-lg h-12"
              step="0.01"
              min={MIN_BET}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
              onClick={setMaxAmount}
            >
              MAX
            </Button>
          </div>
          
          {/* Quick amounts */}
          <div className="flex gap-2">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setAmount(quickAmount.toString())}
              >
                {quickAmount}
              </Button>
            ))}
          </div>
        </div>

        {/* Potential Return */}
        {selectedSide && betAmount > 0 && (
          <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Potential Return</span>
              <span className="font-bold text-yes">
                {formatINJ(potentialReturn)} INJ
                <span className="text-xs ml-1 opacity-80">
                  (+{profitPercentage.toFixed(0)}%)
                </span>
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Points if correct</span>
              <span className="text-gold font-medium">
                +{Math.floor(betAmount * 100)} pts
              </span>
            </div>
          </div>
        )}

        {/* Place Bet Button */}
        <Button
          className="w-full h-12 text-lg gradient-injective"
          disabled={!selectedSide || !amount || betAmount < MIN_BET || betAmount > balance || isPending || isConfirming}
          onClick={handlePlaceBet}
        >
          {isPending || isConfirming ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              {isPending ? 'Confirming...' : 'Processing...'}
            </>
          ) : (
            <>
              <Rocket className="h-5 w-5 mr-2" />
              Place Prediction
            </>
          )}
        </Button>

        {/* Warning */}
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <AlertCircle className="h-3 w-3" />
          You can only place one bet per market
        </p>
      </CardContent>
    </Card>
  );
}

// Skeleton for betting panel
export function BettingPanelSkeleton() {
  return (
    <Card className="glass">
      <CardHeader>
        <div className="h-6 w-32 bg-secondary/50 rounded animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 bg-secondary/50 rounded animate-pulse" />
          <div className="h-16 bg-secondary/50 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-secondary/50 rounded animate-pulse" />
          <div className="h-12 bg-secondary/50 rounded animate-pulse" />
        </div>
        <div className="h-12 bg-secondary/50 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}
