'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Share2,
  MoreVertical,
  Timer,
  Calendar,
  Coins,
  Users,
  TrendingUp,
  TrendingDown,
  Bitcoin,
  Dumbbell,
  Landmark,
  Clapperboard,
  Cpu,
  LineChart,
  CircleDot,
  ExternalLink,
  Copy,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { CountdownTimer } from '@/components/countdown-timer';
import { LiveIndicator } from '@/components/live-indicator';
import { ActivityItem } from '@/components/activity-item';
import { BettingPanel, BettingPanelSkeleton } from '@/components/betting-panel';
import { EmptyState } from '@/components/empty-state';
import { useMarket, useBetPlacedEvents, BetPlacedEvent } from '@/hooks/useContract';
import { 
  formatINJ, 
  getMarketStatus, 
  formatAddress,
  getExplorerUrl,
} from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Category icons mapping
const categoryIcons: Record<string, React.ElementType> = {
  Crypto: Bitcoin,
  Sports: Dumbbell,
  Politics: Landmark,
  Entertainment: Clapperboard,
  Tech: Cpu,
  Finance: LineChart,
};

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const marketId = params.id ? BigInt(params.id as string) : undefined;
  const { market, isLoading, isError } = useMarket(marketId);
  
  // Track bet events via callback
  const [betEvents, setBetEvents] = useState<BetPlacedEvent[]>([]);
  const handleBetEvent = useCallback((event: BetPlacedEvent) => {
    setBetEvents(prev => [event, ...prev].slice(0, 20));
  }, []);
  useBetPlacedEvents(handleBetEvent, marketId);

  // Derived values
  const status = market ? getMarketStatus(market) : null;
  const CategoryIcon = market ? categoryIcons[market.category] || CircleDot : CircleDot;
  const totalPredictors = market ? Number(market.yesCount) + Number(market.noCount) : 0;
  const endDate = market ? new Date(Number(market.endTime) * 1000) : null;

  // Share functionality
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: market?.question || 'iPredict Market',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: 'Link copied!',
          description: 'Market link copied to clipboard',
        });
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  // Copy contract address
  const handleCopyContract = async () => {
    try {
      await navigator.clipboard.writeText(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '');
      toast({
        title: 'Copied!',
        description: 'Contract address copied to clipboard',
      });
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen pb-32 md:pb-8">
        {/* Top Bar Skeleton */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Skeleton className="h-9 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            </div>
            {/* Right Column Skeleton */}
            <div>
              <BettingPanelSkeleton />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (isError || !market) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <EmptyState
          icon={Info}
          title="Market not found"
          description="This market doesn't exist or has been removed."
          action={{
            label: 'Back to Markets',
            onClick: () => router.push('/markets'),
          }}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-32 md:pb-8">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/markets">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Markets
            </Button>
          </Link>
          
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyContract}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Contract Address
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a 
                    href={getExplorerUrl('address', process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '')} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Explorer
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Market Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Image */}
            {market.imageUrl && (
              <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-xl">
                <Image
                  src={market.imageUrl}
                  alt={market.question}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                
                {/* Floating badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge variant="outline" className="bg-background/80 backdrop-blur flex items-center gap-1.5">
                    <CategoryIcon className="h-3 w-3" />
                    {market.category}
                  </Badge>
                  <StatusBadge status={status!} />
                </div>
              </div>
            )}

            {/* Question and Meta */}
            <div className="space-y-4">
              {!market.imageUrl && (
                <div className="flex gap-2">
                  <Badge variant="outline" className="flex items-center gap-1.5">
                    <CategoryIcon className="h-3 w-3" />
                    {market.category}
                  </Badge>
                  <StatusBadge status={status!} />
                </div>
              )}
              
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                {market.question}
              </h1>

              {/* Countdown */}
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  <CountdownTimer endTime={market.endTime} showIcon={false} />
                </div>
                {endDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {endDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="glass">
                <CardContent className="p-4 text-center">
                  <Coins className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{formatINJ(market.totalPool)}</p>
                  <p className="text-xs text-muted-foreground">Total Pool (INJ)</p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-4 text-center">
                  <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{totalPredictors}</p>
                  <p className="text-xs text-muted-foreground">Predictors</p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-2 text-yes" />
                  <p className="text-2xl font-bold">{market.yesPercent}%</p>
                  <p className="text-xs text-muted-foreground">Yes Odds</p>
                </CardContent>
              </Card>
            </div>

            {/* Odds Breakdown */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Odds Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* YES */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-yes" />
                      <span className="font-semibold">YES</span>
                    </div>
                    <span className="text-2xl font-bold text-yes">{market.yesPercent}%</span>
                  </div>
                  <div className="h-4 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yes transition-all duration-500"
                      style={{ width: `${market.yesPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatINJ(market.totalYesBets)} INJ</span>
                    <span>{Number(market.yesCount)} bets</span>
                  </div>
                </div>

                {/* NO */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-no" />
                      <span className="font-semibold">NO</span>
                    </div>
                    <span className="text-2xl font-bold text-no">{market.noPercent}%</span>
                  </div>
                  <div className="h-4 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-no transition-all duration-500"
                      style={{ width: `${market.noPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatINJ(market.totalNoBets)} INJ</span>
                    <span>{Number(market.noCount)} bets</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resolution Details */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Resolution Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Source</span>
                  <span>On-chain Oracle</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolution Method</span>
                  <span>Admin Resolution</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created By</span>
                  <a 
                    href={getExplorerUrl('address', market.creator)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {formatAddress(market.creator)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market ID</span>
                  <span className="font-mono">#{String(market.id)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LiveIndicator size="sm" />
                  LIVE ACTIVITY
                </CardTitle>
              </CardHeader>
              <CardContent>
                {betEvents.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {betEvents.slice(0, 20).map((event, i) => (
                      <ActivityItem
                        key={`${event.txHash}-${i}`}
                        type="bet"
                        user={event.user}
                        amount={event.amount}
                        isYes={event.isYes}
                        timestamp={Number(event.timestamp)}
                        txHash={event.txHash}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No activity yet</p>
                    <p className="text-sm mt-1">Be the first to predict!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Betting Panel */}
          <div className="lg:col-span-1">
            {/* Desktop: Sticky sidebar */}
            <div className="hidden md:block sticky top-20">
              <BettingPanel market={market} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Sticky Bottom Sheet */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-20">
        <BettingPanel market={market} />
      </div>
    </main>
  );
}
