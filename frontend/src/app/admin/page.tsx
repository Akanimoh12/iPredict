'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import {
  Shield,
  Plus,
  Clock,
  Coins,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Wallet,
  PauseCircle,
  PlayCircle,
  TrendingUp,
  TrendingDown,
  Bitcoin,
  Dumbbell,
  Landmark,
  Clapperboard,
  Cpu,
  LineChart,
  CircleDot,
  Image as ImageIcon,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  useAdmin,
  usePlatformStats,
  usePendingMarkets,
  useAccumulatedFees,
  usePausedState,
  useCreateMarket,
  useResolveMarket,
  useWithdrawFees,
  usePause,
  useUnpause,
  useMarketCount,
} from '@/hooks/useContract';
import { formatINJ, getExplorerUrl, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { MarketCard } from '@/components/market-card';
import type { MarketWithOdds } from '@/types';

// Category options
const CATEGORIES = [
  { value: 'Crypto', label: 'Crypto', icon: Bitcoin },
  { value: 'Sports', label: 'Sports', icon: Dumbbell },
  { value: 'Politics', label: 'Politics', icon: Landmark },
  { value: 'Entertainment', label: 'Entertainment', icon: Clapperboard },
  { value: 'Tech', label: 'Tech', icon: Cpu },
  { value: 'Finance', label: 'Finance', icon: LineChart },
  { value: 'Other', label: 'Other', icon: CircleDot },
];

// Duration presets in seconds
const DURATION_PRESETS = [
  { label: '1 Hour', value: 3600 },
  { label: '24 Hours', value: 86400 },
  { label: '7 Days', value: 604800 },
  { label: '30 Days', value: 2592000 },
];

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { admin, isLoading: adminLoading } = useAdmin();
  const { toast } = useToast();

  // Check if connected wallet is admin
  const isAdmin = address && admin && address.toLowerCase() === admin.toLowerCase();

  // Loading state
  if (adminLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </main>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Shield className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to access the admin dashboard
            </p>
            <ConnectButton />
          </div>
        </div>
      </main>
    );
  }

  // Not admin state
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-2">
              This wallet is not authorized to access the admin dashboard.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
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
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage markets and platform settings</p>
          </div>
        </div>

        {/* Platform Stats */}
        <PlatformStatsSection />

        {/* Create Market */}
        <CreateMarketSection />

        {/* Pending Resolutions */}
        <PendingResolutionsSection />

        {/* Platform Controls */}
        <PlatformControlsSection />
      </div>
    </main>
  );
}

// ===========================================
// Platform Stats Section
// ===========================================

function PlatformStatsSection() {
  const { totalVolume, totalMarkets, activeMarkets, estimatedUsers, isLoading } = usePlatformStats();
  const { fees, isLoading: feesLoading } = useAccumulatedFees();

  const stats = [
    { label: 'Total Markets', value: totalMarkets, icon: BarChart3 },
    { label: 'Active Markets', value: activeMarkets, icon: Clock },
    { label: 'Total Volume', value: formatINJ(totalVolume), icon: Coins, suffix: 'INJ' },
    { label: 'Est. Users', value: estimatedUsers, icon: Users },
    { label: 'Accumulated Fees', value: formatINJ(fees ?? BigInt(0)), icon: Wallet, suffix: 'INJ' },
  ];

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        Platform Statistics
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <stat.icon className="h-4 w-4" />
                <span className="text-xs">{stat.label}</span>
              </div>
              {isLoading || feesLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p className="text-xl font-bold">
                  {stat.value}
                  {stat.suffix && <span className="text-sm text-muted-foreground ml-1">{stat.suffix}</span>}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

// ===========================================
// Create Market Section
// ===========================================

function CreateMarketSection() {
  const { toast } = useToast();
  const { createMarket, isPending, isConfirming, isSuccess, isError, error, txHash, reset } = useCreateMarket();
  const { count: marketCount } = useMarketCount();

  // Form state
  const [question, setQuestion] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('Crypto');
  const [duration, setDuration] = useState(86400); // Default 24 hours
  const [customDuration, setCustomDuration] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Preview market
  const previewMarket: MarketWithOdds = {
    id: BigInt(marketCount ?? 0),
    question: question || 'Your market question will appear here...',
    imageUrl: imageUrl || '/placeholder.png',
    category: category,
    endTime: BigInt(Math.floor(Date.now() / 1000) + duration),
    totalYesBets: BigInt(0),
    totalNoBets: BigInt(0),
    yesCount: BigInt(0),
    noCount: BigInt(0),
    resolved: false,
    outcome: false,
    cancelled: false,
    creator: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    createdAt: BigInt(Math.floor(Date.now() / 1000)),
    yesPercent: 50,
    noPercent: 50,
    totalPool: BigInt(0),
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast({ title: 'Error', description: 'Please enter a question', variant: 'destructive' });
      return;
    }

    try {
      await createMarket(question, imageUrl, category, BigInt(duration));
    } catch (err) {
      console.error('Create market error:', err);
    }
  };

  // Handle success
  useEffect(() => {
    if (isSuccess && txHash) {
      setShowSuccess(true);
      toast({
        title: 'Market Created! 🎉',
        description: 'Your market is now live',
        action: (
          <Button variant="outline" size="sm" asChild>
            <a href={getExplorerUrl(txHash)} target="_blank" rel="noopener noreferrer">
              View TX
            </a>
          </Button>
        ),
      });
      // Reset form
      setQuestion('');
      setImageUrl('');
      setCategory('Crypto');
      setDuration(86400);
    }
  }, [isSuccess, txHash, toast]);

  // Handle error
  useEffect(() => {
    if (isError && error) {
      toast({
        title: 'Failed to create market',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [isError, error, toast]);

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Plus className="h-5 w-5 text-primary" />
        Create New Market
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Market Details</CardTitle>
            <CardDescription>Fill in the details for your new prediction market</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Question */}
              <div>
                <label className="text-sm font-medium mb-1 block">Question</label>
                <Input
                  placeholder="Will Bitcoin reach $100k by end of 2026?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">{question.length}/200 characters</p>
              </div>

              {/* Image URL */}
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Image URL (optional)
                </label>
                <Input
                  placeholder="https://example.com/image.png"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  type="url"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all',
                          category === cat.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Duration
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        setDuration(preset.value);
                        setCustomDuration('');
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-all',
                        duration === preset.value && !customDuration
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Custom days"
                    value={customDuration}
                    onChange={(e) => {
                      setCustomDuration(e.target.value);
                      if (e.target.value) {
                        setDuration(parseInt(e.target.value) * 86400);
                      }
                    }}
                    min={1}
                    max={365}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ends: {new Date(Date.now() + duration * 1000).toLocaleString()}
                </p>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={isPending || isConfirming || !question.trim()}
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isPending ? 'Confirm in Wallet...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Market
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <div>
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">Live Preview</h3>
          <MarketCard market={previewMarket} />
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-yes" />
              Market Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Your prediction market is now live and ready for bets.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href={`/markets/${marketCount}`}>
                View Market
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" onClick={() => { setShowSuccess(false); reset(); }}>
              Create Another
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ===========================================
// Pending Resolutions Section
// ===========================================

function PendingResolutionsSection() {
  const { pendingMarkets, isLoading, refetch } = usePendingMarkets();
  const { toast } = useToast();
  const [resolving, setResolving] = useState<{ id: bigint; outcome: boolean } | null>(null);
  
  const { resolveMarket, isPending, isConfirming, isSuccess, isError, error, reset } = useResolveMarket();

  // Handle resolve
  const handleResolve = async () => {
    if (!resolving) return;
    try {
      await resolveMarket(resolving.id, resolving.outcome);
    } catch (err) {
      console.error('Resolve error:', err);
    }
  };

  // Success effect
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: 'Market Resolved! ✓',
        description: `Market resolved as ${resolving?.outcome ? 'YES' : 'NO'}`,
      });
      setResolving(null);
      reset();
      refetch();
    }
  }, [isSuccess, resolving, toast, reset, refetch]);

  // Error effect
  useEffect(() => {
    if (isError && error) {
      toast({
        title: 'Failed to resolve market',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [isError, error, toast]);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          Pending Resolutions
          {pendingMarkets && pendingMarkets.length > 0 && (
            <Badge variant="secondary">{pendingMarkets.length}</Badge>
          )}
        </h2>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : pendingMarkets && pendingMarkets.length > 0 ? (
        <div className="grid gap-4">
          {pendingMarkets.map((market) => (
            <Card key={market.id.toString()} className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{market.category}</Badge>
                      <Badge variant="secondary" className="text-orange-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Awaiting Resolution
                      </Badge>
                    </div>
                    <h3 className="font-medium mb-2">{market.question}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Coins className="h-4 w-4" />
                        Total Pool: {formatINJ(market.totalPool)} INJ
                      </span>
                      <span className="flex items-center gap-1 text-yes">
                        <TrendingUp className="h-4 w-4" />
                        YES: {formatINJ(market.totalYesBets)} ({market.yesPercent}%)
                      </span>
                      <span className="flex items-center gap-1 text-no">
                        <TrendingDown className="h-4 w-4" />
                        NO: {formatINJ(market.totalNoBets)} ({market.noPercent}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-yes text-yes hover:bg-yes hover:text-white"
                      onClick={() => setResolving({ id: market.id, outcome: true })}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve YES
                    </Button>
                    <Button
                      variant="outline"
                      className="border-no text-no hover:bg-no hover:text-white"
                      onClick={() => setResolving({ id: market.id, outcome: false })}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Resolve NO
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card/50">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No markets pending resolution</p>
            <p className="text-sm text-muted-foreground mt-1">
              Markets will appear here when they end
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resolve Confirmation Dialog */}
      <Dialog open={!!resolving} onOpenChange={() => setResolving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Resolution</DialogTitle>
            <DialogDescription>
              Are you sure you want to resolve this market as{' '}
              <span className={resolving?.outcome ? 'text-yes font-bold' : 'text-no font-bold'}>
                {resolving?.outcome ? 'YES' : 'NO'}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolving(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={isPending || isConfirming}
              className={resolving?.outcome ? 'bg-yes hover:bg-yes/90' : 'bg-no hover:bg-no/90'}
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isPending ? 'Confirming...' : 'Resolving...'}
                </>
              ) : (
                <>Confirm {resolving?.outcome ? 'YES' : 'NO'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ===========================================
// Platform Controls Section
// ===========================================

function PlatformControlsSection() {
  const { toast } = useToast();
  const { fees, refetch: refetchFees } = useAccumulatedFees();
  const { isPaused, refetch: refetchPaused } = usePausedState();
  
  const { withdrawFees, isPending: withdrawPending, isConfirming: withdrawConfirming, isSuccess: withdrawSuccess, isError: withdrawError, error: withdrawErrorMsg, reset: resetWithdraw } = useWithdrawFees();
  const { pause, isPending: pausePending, isConfirming: pauseConfirming, isSuccess: pauseSuccess } = usePause();
  const { unpause, isPending: unpausePending, isConfirming: unpauseConfirming, isSuccess: unpauseSuccess } = useUnpause();

  // Withdraw success
  useEffect(() => {
    if (withdrawSuccess) {
      toast({ title: 'Fees Withdrawn! 💰', description: 'Fees have been sent to your wallet' });
      refetchFees();
      resetWithdraw();
    }
  }, [withdrawSuccess, toast, refetchFees, resetWithdraw]);

  // Withdraw error
  useEffect(() => {
    if (withdrawError && withdrawErrorMsg) {
      toast({ title: 'Withdrawal Failed', description: withdrawErrorMsg.message, variant: 'destructive' });
    }
  }, [withdrawError, withdrawErrorMsg, toast]);

  // Pause/unpause success
  useEffect(() => {
    if (pauseSuccess || unpauseSuccess) {
      toast({ title: pauseSuccess ? 'Contract Paused' : 'Contract Unpaused' });
      refetchPaused();
    }
  }, [pauseSuccess, unpauseSuccess, toast, refetchPaused]);

  const hasFees = fees && fees > BigInt(0);

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        Platform Controls
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Withdraw Fees */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Accumulated Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-4">
              {formatINJ(fees ?? BigInt(0))} <span className="text-lg text-muted-foreground">INJ</span>
            </p>
            <Button
              onClick={() => withdrawFees()}
              disabled={!hasFees || withdrawPending || withdrawConfirming}
              className="w-full"
            >
              {withdrawPending || withdrawConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {withdrawPending ? 'Confirming...' : 'Withdrawing...'}
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  Withdraw Fees
                </>
              )}
            </Button>
            {!hasFees && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                No fees to withdraw
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pause/Unpause */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {isPaused ? (
                <PauseCircle className="h-5 w-5 text-destructive" />
              ) : (
                <PlayCircle className="h-5 w-5 text-yes" />
              )}
              Contract Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Badge
                variant={isPaused ? 'destructive' : 'secondary'}
                className={cn(
                  'text-lg px-4 py-1',
                  !isPaused && 'bg-yes/10 text-yes border-yes'
                )}
              >
                {isPaused ? 'PAUSED' : 'ACTIVE'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {isPaused
                ? 'The contract is paused. No new bets or market creations are allowed.'
                : 'The contract is active and accepting bets.'}
            </p>
            {isPaused ? (
              <Button
                onClick={() => unpause()}
                disabled={unpausePending || unpauseConfirming}
                className="w-full bg-yes hover:bg-yes/90"
              >
                {unpausePending || unpauseConfirming ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4 mr-2" />
                )}
                Unpause Contract
              </Button>
            ) : (
              <Button
                onClick={() => pause()}
                disabled={pausePending || pauseConfirming}
                variant="destructive"
                className="w-full"
              >
                {pausePending || pauseConfirming ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PauseCircle className="h-4 w-4 mr-2" />
                )}
                Pause Contract
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
