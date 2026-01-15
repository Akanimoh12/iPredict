'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import {
  Trophy,
  Medal,
  Crown,
  Copy,
  Check,
  User,
  Rocket,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserStats, useMarkets } from '@/hooks/useContract';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

// Types
interface LeaderboardEntry {
  rank: number;
  address: `0x${string}`;
  points: bigint;
  correctBets: bigint;
  totalBets: bigint;
  winRate: number;
}

// Mock leaderboard data (in production, this would come from an indexer or subgraph)
// For now, we'll aggregate from market data
function useLeaderboard() {
  const { isLoading } = useMarkets(0, 100);
  
  // In a real implementation, you'd aggregate user stats from events or a database
  // For now, we'll create mock data based on what we have
  const leaderboard = useMemo<LeaderboardEntry[]>(() => {
    // Mock top users for demonstration
    const mockUsers: LeaderboardEntry[] = [
      {
        rank: 1,
        address: '0x9bcf302cFCB64406b557342c2715e85Ac62A4693' as `0x${string}`,
        points: BigInt(1250),
        correctBets: BigInt(15),
        totalBets: BigInt(20),
        winRate: 75,
      },
      {
        rank: 2,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7e1a1' as `0x${string}`,
        points: BigInt(980),
        correctBets: BigInt(12),
        totalBets: BigInt(18),
        winRate: 67,
      },
      {
        rank: 3,
        address: '0x8B3392483BA26D65E331dB86D4F4308E3b5f0a53' as `0x${string}`,
        points: BigInt(720),
        correctBets: BigInt(9),
        totalBets: BigInt(15),
        winRate: 60,
      },
      {
        rank: 4,
        address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        points: BigInt(650),
        correctBets: BigInt(8),
        totalBets: BigInt(14),
        winRate: 57,
      },
      {
        rank: 5,
        address: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01' as `0x${string}`,
        points: BigInt(520),
        correctBets: BigInt(7),
        totalBets: BigInt(12),
        winRate: 58,
      },
      {
        rank: 6,
        address: '0xDEF0123456789ABCDEF0123456789ABCDEF01234' as `0x${string}`,
        points: BigInt(480),
        correctBets: BigInt(6),
        totalBets: BigInt(11),
        winRate: 55,
      },
      {
        rank: 7,
        address: '0x567890ABCDEF0123456789ABCDEF0123456789AB' as `0x${string}`,
        points: BigInt(410),
        correctBets: BigInt(5),
        totalBets: BigInt(10),
        winRate: 50,
      },
      {
        rank: 8,
        address: '0x890ABCDEF0123456789ABCDEF0123456789ABCDE' as `0x${string}`,
        points: BigInt(350),
        correctBets: BigInt(4),
        totalBets: BigInt(9),
        winRate: 44,
      },
      {
        rank: 9,
        address: '0xCDEF0123456789ABCDEF0123456789ABCDEF0123' as `0x${string}`,
        points: BigInt(290),
        correctBets: BigInt(4),
        totalBets: BigInt(8),
        winRate: 50,
      },
      {
        rank: 10,
        address: '0x0123456789ABCDEF0123456789ABCDEF01234567' as `0x${string}`,
        points: BigInt(230),
        correctBets: BigInt(3),
        totalBets: BigInt(7),
        winRate: 43,
      },
    ];
    
    return mockUsers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { leaderboard, isLoading };
}

type TimePeriod = 'week' | 'month' | 'all';

export default function LeaderboardPage() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [period, setPeriod] = useState<TimePeriod>('all');
  const [page, setPage] = useState(0);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  
  const { leaderboard, isLoading } = useLeaderboard();
  const { stats: userStats, winRate: userWinRate, isLoading: userStatsLoading } = useUserStats(address);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil((leaderboard?.length ?? 0) / ITEMS_PER_PAGE);
  const paginatedLeaderboard = leaderboard?.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const top3 = leaderboard?.slice(0, 3) ?? [];

  // Find user's rank
  const userRank = useMemo(() => {
    if (!address || !leaderboard) return null;
    const index = leaderboard.findIndex(
      (entry) => entry.address.toLowerCase() === address.toLowerCase()
    );
    return index !== -1 ? index + 1 : null;
  }, [address, leaderboard]);

  // Copy address to clipboard
  const copyAddress = async (addr: string) => {
    try {
      await navigator.clipboard.writeText(addr);
      setCopiedAddress(addr);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  // Format address
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Leaderboard</h1>
              <p className="text-muted-foreground">Top predictors ranked by points</p>
            </div>
          </div>

          {/* Period Filter */}
          <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
            <TabsList>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Your Stats Card */}
        {isConnected && (
          <Card className="mb-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Stats</p>
                    <p className="font-medium">{formatAddress(address!)}</p>
                  </div>
                </div>

                {userStatsLoading ? (
                  <div className="flex gap-8">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-12 w-20" />
                    ))}
                  </div>
                ) : userStats && userStats.totalBets > 0 ? (
                  <div className="flex flex-wrap gap-6 md:gap-8">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {userRank ? `#${userRank}` : '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">Rank</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{userStats.totalPoints.toString()}</p>
                      <p className="text-xs text-muted-foreground">Points</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yes">
                        {userStats.correctBets.toString()}/{userStats.totalBets.toString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Correct</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{userWinRate}%</p>
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <p className="text-muted-foreground">No predictions yet</p>
                    <Button asChild size="sm">
                      <Link href="/markets">
                        <Rocket className="h-4 w-4 mr-2" />
                        Start Predicting
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Not Connected Prompt */}
        {!isConnected && (
          <Card className="mb-8 bg-card/50">
            <CardContent className="p-6 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                Connect your wallet to see your ranking
              </p>
              <ConnectButton />
            </CardContent>
          </Card>
        )}

        {/* Top 3 Podium */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Top Predictors
          </h2>

          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {/* Second Place */}
              {top3[1] && (
                <PodiumCard entry={top3[1]} isCurrentUser={address?.toLowerCase() === top3[1].address.toLowerCase()} onCopy={copyAddress} copied={copiedAddress === top3[1].address} />
              )}
              
              {/* First Place */}
              {top3[0] && (
                <PodiumCard entry={top3[0]} isCurrentUser={address?.toLowerCase() === top3[0].address.toLowerCase()} onCopy={copyAddress} copied={copiedAddress === top3[0].address} isFirst />
              )}
              
              {/* Third Place */}
              {top3[2] && (
                <PodiumCard entry={top3[2]} isCurrentUser={address?.toLowerCase() === top3[2].address.toLowerCase()} onCopy={copyAddress} copied={copiedAddress === top3[2].address} />
              )}
            </div>
          )}
        </section>

        {/* Full Rankings Table */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Medal className="h-5 w-5 text-primary" />
            Full Rankings
          </h2>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Table Header */}
                  <div className="grid grid-cols-5 gap-4 p-4 border-b text-sm font-medium text-muted-foreground">
                    <div>Rank</div>
                    <div>Address</div>
                    <div className="text-right">Points</div>
                    <div className="text-right">Correct</div>
                    <div className="text-right">Win Rate</div>
                  </div>

                  {/* Table Rows */}
                  {paginatedLeaderboard?.map((entry) => {
                    const isCurrentUser = address?.toLowerCase() === entry.address.toLowerCase();
                    return (
                      <div
                        key={entry.address}
                        className={cn(
                          'grid grid-cols-5 gap-4 p-4 items-center border-b last:border-0 transition-colors',
                          isCurrentUser && 'bg-primary/5'
                        )}
                      >
                        {/* Rank */}
                        <div className="flex items-center gap-2">
                          {entry.rank <= 3 ? (
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                                entry.rank === 1 && 'bg-yellow-500/20 text-yellow-500',
                                entry.rank === 2 && 'bg-gray-400/20 text-gray-400',
                                entry.rank === 3 && 'bg-orange-600/20 text-orange-600'
                              )}
                            >
                              {entry.rank}
                            </div>
                          ) : (
                            <span className="w-8 text-center text-muted-foreground">
                              {entry.rank}
                            </span>
                          )}
                          {isCurrentUser && (
                            <Badge variant="secondary" className="text-xs">You</Badge>
                          )}
                        </div>

                        {/* Address */}
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {formatAddress(entry.address)}
                          </span>
                          <button
                            onClick={() => copyAddress(entry.address)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedAddress === entry.address ? (
                              <Check className="h-4 w-4 text-yes" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {/* Points */}
                        <div className="text-right font-medium">
                          {entry.points.toString()}
                        </div>

                        {/* Correct Predictions */}
                        <div className="text-right text-muted-foreground">
                          {entry.correctBets.toString()}/{entry.totalBets.toString()}
                        </div>

                        {/* Win Rate */}
                        <div className="text-right">
                          <Badge
                            variant="secondary"
                            className={cn(
                              entry.winRate >= 60 && 'bg-yes/10 text-yes',
                              entry.winRate < 40 && 'bg-no/10 text-no'
                            )}
                          >
                            {entry.winRate}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// ===========================================
// Podium Card Component
// ===========================================

interface PodiumCardProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  onCopy: (addr: string) => void;
  copied: boolean;
  isFirst?: boolean;
}

function PodiumCard({ entry, isCurrentUser, onCopy, copied, isFirst }: PodiumCardProps) {
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const getRankStyles = () => {
    switch (entry.rank) {
      case 1:
        return {
          bg: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20',
          border: 'border-yellow-500/30',
          medal: 'text-yellow-500',
          label: '1st Place',
        };
      case 2:
        return {
          bg: 'bg-gradient-to-br from-gray-400/20 to-gray-500/20',
          border: 'border-gray-400/30',
          medal: 'text-gray-400',
          label: '2nd Place',
        };
      case 3:
        return {
          bg: 'bg-gradient-to-br from-orange-600/20 to-orange-700/20',
          border: 'border-orange-600/30',
          medal: 'text-orange-600',
          label: '3rd Place',
        };
      default:
        return {
          bg: 'bg-card/50',
          border: 'border-border',
          medal: 'text-muted-foreground',
          label: `${entry.rank}th Place`,
        };
    }
  };

  const styles = getRankStyles();

  return (
    <Card
      className={cn(
        styles.bg,
        'border-2',
        styles.border,
        isFirst && 'md:-mt-4 md:scale-105',
        isCurrentUser && 'ring-2 ring-primary'
      )}
    >
      <CardContent className="p-6 text-center">
        {/* Medal */}
        <div className="flex justify-center mb-3">
          <div className={cn('p-3 rounded-full', styles.bg)}>
            {entry.rank === 1 ? (
              <Crown className={cn('h-8 w-8', styles.medal)} />
            ) : (
              <Medal className={cn('h-8 w-8', styles.medal)} />
            )}
          </div>
        </div>

        {/* Rank Label */}
        <Badge
          variant="secondary"
          className={cn('mb-3', entry.rank === 1 && 'bg-yellow-500/20 text-yellow-500')}
        >
          {styles.label}
        </Badge>

        {/* Address */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="font-mono font-medium">{formatAddress(entry.address)}</span>
          <button
            onClick={() => onCopy(entry.address)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-yes" /> : <Copy className="h-4 w-4" />}
          </button>
          {isCurrentUser && <Badge variant="outline" className="text-xs">You</Badge>}
        </div>

        {/* Points */}
        <p className="text-3xl font-bold mb-1">{entry.points.toString()}</p>
        <p className="text-sm text-muted-foreground mb-4">Points</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-yes">{entry.correctBets.toString()}/{entry.totalBets.toString()}</p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </div>
          <div>
            <p className="font-medium">{entry.winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
