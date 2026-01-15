'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  User,
  Wallet,
  Trophy,
  Target,
  Percent,
  Coins,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Gift,
  Loader2,
  RefreshCw,
  Filter,
  History,
  Award,
  PartyPopper,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  useUserStats,
  useUserMarkets,
  useClaimableMarkets,
  useMarket,
  useUserBet,
  useClaimWinnings,
  useBatchClaim,
  useCalculateWinnings,
} from '@/hooks/useContract';
import { formatINJ, getExplorerUrl, cn, getTimeRemaining } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CountdownTimer } from '@/components/countdown-timer';
import { StatusBadge } from '@/components/status-badge';
import type { MarketWithOdds, Bet } from '@/types';

// Confetti celebration
const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    zIndex: 9999,
  });
};

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { toast } = useToast();
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Fetch user data
  const { stats, winRate, isLoading: statsLoading, refetch: refetchStats } = useUserStats(address);
  const { marketIds, isLoading: marketsLoading, refetch: refetchMarkets } = useUserMarkets(address);
  const { claimableMarketIds, isLoading: claimableLoading, refetch: refetchClaimable } = useClaimableMarkets(address);

  // Copy address
  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
      toast({ title: 'Address copied!' });
    } catch (err) {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  // Refetch all data
  const refetchAll = () => {
    refetchStats();
    refetchMarkets();
    refetchClaimable();
  };

  // Not connected state
  if (!isConnected) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Your Profile</h1>
            <p className="text-muted-foreground mb-2 max-w-md">
              Connect your wallet to view your betting history, stats, and claim your winnings.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              You&apos;ll see your active bets, claimable rewards, and prediction performance.
            </p>
            <ConnectButton />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl font-bold font-mono">
                      {address?.slice(0, 8)}...{address?.slice(-6)}
                    </h1>
                    <button
                      onClick={copyAddress}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedAddress ? (
                        <Check className="h-4 w-4 text-yes" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Wallet className="h-4 w-4" />
                      {balanceData ? Number(balanceData.formatted).toFixed(4) : '0'} INJ
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      {statsLoading ? <Skeleton className="h-4 w-12" /> : stats?.totalPoints.toString() ?? '0'} Points
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              {statsLoading ? (
                <div className="flex gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-20" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4 md:gap-6">
                  <StatBox
                    icon={Target}
                    label="Total Bets"
                    value={stats?.totalBets.toString() ?? '0'}
                  />
                  <StatBox
                    icon={CheckCircle}
                    label="Wins"
                    value={stats?.correctBets.toString() ?? '0'}
                    className="text-yes"
                  />
                  <StatBox
                    icon={XCircle}
                    label="Losses"
                    value={stats ? (Number(stats.totalBets) - Number(stats.correctBets)).toString() : '0'}
                    className="text-no"
                  />
                  <StatBox
                    icon={Percent}
                    label="Win Rate"
                    value={`${winRate}%`}
                  />
                </div>
              )}
            </div>

            {/* Total Winnings */}
            {stats && stats.totalWinnings > BigInt(0) && (
              <div className="mt-4 pt-4 border-t border-primary/20">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Coins className="h-4 w-4" />
                  <span>Total Winnings:</span>
                  <span className="font-bold text-foreground">
                    {formatINJ(stats.totalWinnings)} INJ
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="active" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Active Bets
                {marketIds && !claimableMarketIds && (
                  <Badge variant="secondary" className="ml-1">{marketIds.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="claimable" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Claimable
                {claimableMarketIds && claimableMarketIds.length > 0 && (
                  <Badge className="ml-1 bg-yes">{claimableMarketIds.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="sm" onClick={refetchAll}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Active Bets Tab */}
          <TabsContent value="active">
            <ActiveBetsSection 
              marketIds={marketIds} 
              claimableIds={claimableMarketIds}
              isLoading={marketsLoading} 
              address={address!} 
            />
          </TabsContent>

          {/* Claimable Winnings Tab */}
          <TabsContent value="claimable">
            <ClaimableSection 
              claimableIds={claimableMarketIds} 
              isLoading={claimableLoading} 
              address={address!}
              onClaimed={refetchAll}
            />
          </TabsContent>

          {/* Betting History Tab */}
          <TabsContent value="history">
            <BettingHistorySection 
              marketIds={marketIds} 
              isLoading={marketsLoading} 
              address={address!} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

// ===========================================
// Stat Box Component
// ===========================================

interface StatBoxProps {
  icon: React.ElementType;
  label: string;
  value: string;
  className?: string;
}

function StatBox({ icon: Icon, label, value, className }: StatBoxProps) {
  return (
    <div className="text-center">
      <Icon className={cn('h-5 w-5 mx-auto mb-1', className)} />
      <p className={cn('text-xl font-bold', className)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ===========================================
// Active Bets Section
// ===========================================

interface ActiveBetsSectionProps {
  marketIds: bigint[] | undefined;
  claimableIds: bigint[] | undefined;
  isLoading: boolean;
  address: `0x${string}`;
}

function ActiveBetsSection({ marketIds, claimableIds, isLoading, address }: ActiveBetsSectionProps) {
  // Filter to only active (not resolved) markets
  const activeIds = useMemo(() => {
    if (!marketIds) return [];
    const claimableSet = new Set(claimableIds?.map(id => id.toString()) ?? []);
    return marketIds.filter(id => !claimableSet.has(id.toString()));
  }, [marketIds, claimableIds]);

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!activeIds || activeIds.length === 0) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-8 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No active bets</p>
          <Button asChild>
            <Link href="/markets">Browse Markets</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {activeIds.map((marketId) => (
        <ActiveBetCard key={marketId.toString()} marketId={marketId} address={address} />
      ))}
    </div>
  );
}

// Active Bet Card
function ActiveBetCard({ marketId, address }: { marketId: bigint; address: `0x${string}` }) {
  const { market, isLoading } = useMarket(marketId) as { market: MarketWithOdds | undefined; isLoading: boolean };
  const { bet } = useUserBet(marketId, address);

  if (isLoading || !market || !bet) {
    return <Skeleton className="h-24 w-full" />;
  }

  // Skip resolved/cancelled markets
  if (market.resolved || market.cancelled) {
    return null;
  }

  const timeRemaining = getTimeRemaining(market.endTime);
  const isEnding = timeRemaining.days === 0 && timeRemaining.hours < 24;

  return (
    <Card className="bg-card/50 hover:bg-card/80 transition-colors">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{market.category}</Badge>
              {isEnding && (
                <Badge variant="secondary" className="text-orange-500">
                  <Clock className="h-3 w-3 mr-1" />
                  Ending Soon
                </Badge>
              )}
            </div>
            <Link 
              href={`/markets/${marketId}`}
              className="font-medium hover:text-primary transition-colors line-clamp-2"
            >
              {market.question}
            </Link>
          </div>

          <div className="flex items-center gap-6">
            {/* Your Bet */}
            <div className="text-center">
              <Badge className={bet.isYes ? 'bg-yes' : 'bg-no'}>
                {bet.isYes ? (
                  <><TrendingUp className="h-3 w-3 mr-1" /> YES</>
                ) : (
                  <><TrendingDown className="h-3 w-3 mr-1" /> NO</>
                )}
              </Badge>
              <p className="text-sm font-medium mt-1">{formatINJ(bet.amount)} INJ</p>
            </div>

            {/* Current Odds */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Current Odds</p>
              <p className={cn('font-medium', bet.isYes ? 'text-yes' : 'text-no')}>
                {bet.isYes ? market.yesPercent : market.noPercent}%
              </p>
            </div>

            {/* Time Remaining */}
            <div className="text-center min-w-[100px]">
              <CountdownTimer endTime={market.endTime} compact />
            </div>

            {/* View Link */}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/markets/${marketId}`}>
                View
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===========================================
// Claimable Section
// ===========================================

interface ClaimableSectionProps {
  claimableIds: bigint[] | undefined;
  isLoading: boolean;
  address: `0x${string}`;
  onClaimed: () => void;
}

function ClaimableSection({ claimableIds, isLoading, address, onClaimed }: ClaimableSectionProps) {
  const { toast } = useToast();
  const { batchClaim, isPending: batchPending, isConfirming: batchConfirming, isSuccess: batchSuccess, isError: batchError, error: batchErrorMsg, reset: resetBatch } = useBatchClaim();

  // Handle batch claim success
  useEffect(() => {
    if (batchSuccess) {
      triggerConfetti();
      toast({ title: 'All Winnings Claimed! 🎉', description: 'Your rewards have been sent to your wallet' });
      onClaimed();
      resetBatch();
    }
  }, [batchSuccess, toast, onClaimed, resetBatch]);

  // Handle batch claim error
  useEffect(() => {
    if (batchError && batchErrorMsg) {
      toast({ title: 'Claim Failed', description: batchErrorMsg.message, variant: 'destructive' });
    }
  }, [batchError, batchErrorMsg, toast]);

  const handleClaimAll = async () => {
    if (!claimableIds || claimableIds.length === 0) return;
    try {
      await batchClaim(claimableIds);
    } catch (err) {
      console.error('Batch claim error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!claimableIds || claimableIds.length === 0) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-8 text-center">
          <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No winnings to claim</p>
          <p className="text-sm text-muted-foreground mt-1">
            Win predictions to earn rewards!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Claim All Button */}
      {claimableIds.length > 1 && (
        <Card className="bg-gradient-to-r from-yes/10 to-yes/5 border-yes/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PartyPopper className="h-6 w-6 text-yes" />
              <div>
                <p className="font-medium">You have {claimableIds.length} claimable rewards!</p>
                <p className="text-sm text-muted-foreground">Claim all at once to save gas</p>
              </div>
            </div>
            <Button
              onClick={handleClaimAll}
              disabled={batchPending || batchConfirming}
              className="bg-yes hover:bg-yes/90"
            >
              {batchPending || batchConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {batchPending ? 'Confirming...' : 'Claiming...'}
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Claim All
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Individual Claimable Cards */}
      {claimableIds.map((marketId) => (
        <ClaimableCard 
          key={marketId.toString()} 
          marketId={marketId} 
          address={address}
          onClaimed={onClaimed}
        />
      ))}
    </div>
  );
}

// Claimable Card
function ClaimableCard({ marketId, address, onClaimed }: { marketId: bigint; address: `0x${string}`; onClaimed: () => void }) {
  const { toast } = useToast();
  const { market, isLoading } = useMarket(marketId) as { market: MarketWithOdds | undefined; isLoading: boolean };
  const { bet } = useUserBet(marketId, address);
  const { winnings } = useCalculateWinnings(marketId, address);
  const { claimWinnings, isPending, isConfirming, isSuccess, isError, error, reset } = useClaimWinnings();

  // Handle claim success
  useEffect(() => {
    if (isSuccess) {
      triggerConfetti();
      toast({ title: 'Winnings Claimed! 🎉' });
      onClaimed();
      reset();
    }
  }, [isSuccess, toast, onClaimed, reset]);

  // Handle claim error
  useEffect(() => {
    if (isError && error) {
      toast({ title: 'Claim Failed', description: error.message, variant: 'destructive' });
    }
  }, [isError, error, toast]);

  if (isLoading || !market || !bet) {
    return <Skeleton className="h-24 w-full" />;
  }

  const handleClaim = async () => {
    try {
      await claimWinnings(marketId);
    } catch (err) {
      console.error('Claim error:', err);
    }
  };

  return (
    <Card className="bg-card/50 border-yes/30">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{market.category}</Badge>
              <Badge className="bg-yes">
                <CheckCircle className="h-3 w-3 mr-1" />
                You Won!
              </Badge>
            </div>
            <Link 
              href={`/markets/${marketId}`}
              className="font-medium hover:text-primary transition-colors line-clamp-2"
            >
              {market.question}
            </Link>
          </div>

          <div className="flex items-center gap-6">
            {/* Your Bet */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Your Bet</p>
              <Badge className={bet.isYes ? 'bg-yes' : 'bg-no'}>
                {bet.isYes ? 'YES' : 'NO'}
              </Badge>
              <p className="text-sm mt-1">{formatINJ(bet.amount)} INJ</p>
            </div>

            {/* Winnings */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Winnings</p>
              <p className="text-xl font-bold text-yes">{formatINJ(winnings ?? BigInt(0))} INJ</p>
            </div>

            {/* Claim Button */}
            <Button
              onClick={handleClaim}
              disabled={isPending || isConfirming}
              className="bg-yes hover:bg-yes/90"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isPending ? 'Confirming...' : 'Claiming...'}
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Claim
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===========================================
// Betting History Section
// ===========================================

interface BettingHistorySectionProps {
  marketIds: bigint[] | undefined;
  isLoading: boolean;
  address: `0x${string}`;
}

function BettingHistorySection({ marketIds, isLoading, address }: BettingHistorySectionProps) {
  const [filter, setFilter] = useState<'all' | 'won' | 'lost'>('all');

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!marketIds || marketIds.length === 0) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-8 text-center">
          <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No betting history</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your past predictions will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-2">
          {(['all', 'won', 'lost'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 rounded-full text-sm transition-all',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="grid gap-3">
        {marketIds.map((marketId) => (
          <HistoryCard 
            key={marketId.toString()} 
            marketId={marketId} 
            address={address}
            filter={filter}
          />
        ))}
      </div>
    </div>
  );
}

// History Card
function HistoryCard({ marketId, address, filter }: { marketId: bigint; address: `0x${string}`; filter: 'all' | 'won' | 'lost' }) {
  const { market, isLoading } = useMarket(marketId) as { market: MarketWithOdds | undefined; isLoading: boolean };
  const { bet } = useUserBet(marketId, address);

  if (isLoading || !market || !bet) {
    return <Skeleton className="h-16 w-full" />;
  }

  // Determine outcome
  let outcome: 'pending' | 'won' | 'lost' | 'cancelled' = 'pending';
  if (market.cancelled) {
    outcome = 'cancelled';
  } else if (market.resolved) {
    outcome = bet.isYes === market.outcome ? 'won' : 'lost';
  }

  // Filter logic
  if (filter === 'won' && outcome !== 'won') return null;
  if (filter === 'lost' && outcome !== 'lost') return null;

  return (
    <Card className="bg-card/50">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link 
              href={`/markets/${marketId}`}
              className="font-medium hover:text-primary transition-colors line-clamp-1"
            >
              {market.question}
            </Link>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">{market.category}</Badge>
              <span>·</span>
              <span>{new Date(Number(bet.timestamp) * 1000).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Your Choice */}
            <div className="text-center">
              <Badge className={cn('text-xs', bet.isYes ? 'bg-yes/20 text-yes' : 'bg-no/20 text-no')}>
                {bet.isYes ? 'YES' : 'NO'}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">{formatINJ(bet.amount)} INJ</p>
            </div>

            {/* Outcome */}
            <div className="text-center min-w-[80px]">
              {outcome === 'pending' && (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
              {outcome === 'won' && (
                <Badge className="bg-yes">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Won
                </Badge>
              )}
              {outcome === 'lost' && (
                <Badge className="bg-no">
                  <XCircle className="h-3 w-3 mr-1" />
                  Lost
                </Badge>
              )}
              {outcome === 'cancelled' && (
                <Badge variant="secondary">
                  Cancelled
                </Badge>
              )}
            </div>

            {/* View */}
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/markets/${marketId}`}>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
