'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Rocket, 
  Zap, 
  Trophy,
  Wallet,
  Target,
  Gift,
  Clock,
  DollarSign,
  Eye,
  Gamepad2,
  Lock,
  Globe,
  Check,
  Circle,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Github,
  Users,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LiveIndicator } from '@/components/live-indicator';
import { AnimatedCounter } from '@/components/animated-counter';
import { MarketCard, MarketCardSkeleton } from '@/components/market-card';
import { ActivityItem } from '@/components/activity-item';
import { EmptyState } from '@/components/empty-state';
import { useMarkets, usePlatformStats, useBetPlacedEvents, useWinningsClaimedEvents, type BetPlacedEvent, type WinningsClaimedEvent } from '@/hooks/useContract';
import { cn } from '@/lib/utils';

// ===========================================
// SECTION 1: Hero
// ===========================================
function HeroSection() {
  const { totalVolume, activeMarkets, estimatedUsers, isLoading } = usePlatformStats();

  const stats = [
    { 
      label: 'Total Volume', 
      value: isLoading ? 0 : Number(totalVolume) / 1e18,
      suffix: ' INJ',
      decimals: 1,
    },
    { 
      label: 'Active Markets', 
      value: isLoading ? 0 : activeMarkets,
      suffix: '',
      decimals: 0,
    },
    { 
      label: 'Predictors', 
      value: isLoading ? 0 : estimatedUsers,
      suffix: '+',
      decimals: 0,
    },
    { 
      label: 'Payout Rate', 
      value: 98,
      suffix: '%',
      decimals: 0,
    },
  ];

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto text-center">
        <Badge className="mb-6 gradient-injective text-primary-foreground px-4 py-1.5">
          <Zap className="h-3 w-3 mr-1" />
          Powered by Injective
        </Badge>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          <span className="gradient-injective-text">THE FUTURE</span>
          <br />
          <span className="text-foreground">IS YOURS TO PREDICT</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Decentralized prediction markets on Injective EVM. 
          Make predictions, earn points, and win rewards with near-instant finality.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="/markets">
            <Button size="lg" className="gradient-injective text-primary-foreground glow-primary gap-2 w-full sm:w-auto">
              <Rocket className="h-5 w-5" />
              Explore Markets
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="gap-2" asChild>
            <a href="#how-it-works">
              <Target className="h-5 w-5" />
              How It Works
            </a>
          </Button>
        </div>

        {/* Live Platform Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {stats.map((stat) => (
            <Card key={stat.label} className="glass border-primary/20">
              <CardContent className="pt-6 pb-4 text-center">
                <p className="text-2xl md:text-3xl font-bold gradient-injective-text">
                  <AnimatedCounter 
                    value={stat.value} 
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                  />
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===========================================
// SECTION 2: Featured Markets
// ===========================================
function FeaturedMarketsSection() {
  const { markets, isLoading, isError } = useMarkets(0, 4);

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-bold">TRENDING MARKETS</h2>
            <LiveIndicator />
          </div>
          <Link href="/markets">
            <Button variant="ghost" className="gap-2 group">
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto">
            {[...Array(4)].map((_, i) => (
              <MarketCardSkeleton key={i} />
            ))}
          </div>
        ) : isError || !markets?.length ? (
          <Card className="glass p-12">
            <EmptyState
              icon={BarChart3}
              title="No markets available"
              description="Check back soon for new prediction markets!"
              action={{
                label: 'Refresh',
                onClick: () => window.location.reload(),
              }}
            />
          </Card>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
            {markets.map((market) => (
              <div key={String(market.id)} className="min-w-[300px] md:min-w-0 snap-start">
                <MarketCard market={market} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ===========================================
// SECTION 3: How It Works
// ===========================================
function HowItWorksSection() {
  const steps = [
    {
      icon: Wallet,
      title: 'Connect Wallet',
      description: 'Connect your wallet to get started. We support MetaMask, WalletConnect, and more.',
      color: 'bg-cyan-500/20 text-cyan-400',
    },
    {
      icon: Target,
      title: 'Make Prediction',
      description: 'Browse markets and predict YES or NO on future outcomes. Set your stake amount.',
      color: 'bg-primary/20 text-primary',
    },
    {
      icon: Gift,
      title: 'Win & Earn Points',
      description: 'Correct predictions earn you rewards from the pool plus points for the leaderboard.',
      color: 'bg-gold/20 text-gold',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">HOW IT WORKS</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start predicting in three simple steps. No complex setup required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}
              
              <Card className="glass text-center h-full hover:glow-primary transition-all duration-300">
                <CardContent className="pt-8 pb-6">
                  <div className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6',
                    step.color
                  )}>
                    <step.icon className="h-8 w-8" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">STEP {index + 1}</div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===========================================
// SECTION 4: Live Activity Feed
// ===========================================
function LiveActivitySection() {
  const [activities, setActivities] = useState<Array<{
    id: string;
    type: 'bet' | 'claim';
    user: `0x${string}`;
    amount: bigint;
    isYes?: boolean;
    timestamp: number;
    txHash: `0x${string}`;
  }>>([]);

  const handleBetPlaced = useCallback((event: BetPlacedEvent) => {
    setActivities((prev) => [
      {
        id: `bet-${event.txHash}`,
        type: 'bet',
        user: event.user,
        amount: event.amount,
        isYes: event.isYes,
        timestamp: Number(event.timestamp),
        txHash: event.txHash,
      },
      ...prev.slice(0, 9), // Keep only last 10
    ]);
  }, []);

  const handleWinningsClaimed = useCallback((event: WinningsClaimedEvent) => {
    setActivities((prev) => [
      {
        id: `claim-${event.txHash}`,
        type: 'claim',
        user: event.user,
        amount: event.amount,
        timestamp: Math.floor(Date.now() / 1000),
        txHash: event.txHash,
      },
      ...prev.slice(0, 9),
    ]);
  }, []);

  useBetPlacedEvents(handleBetPlaced);
  useWinningsClaimedEvents(handleWinningsClaimed);

  // Sample activities for demo when no live events
  const sampleActivities = [
    { id: '1', type: 'bet' as const, user: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`, amount: BigInt(5e18), isYes: true, timestamp: Math.floor(Date.now()/1000) - 120, txHash: '0xabc123' as `0x${string}` },
    { id: '2', type: 'claim' as const, user: '0xabcdef1234567890abcdef1234567890abcdef12' as `0x${string}`, amount: BigInt(15e18), timestamp: Math.floor(Date.now()/1000) - 300, txHash: '0xdef456' as `0x${string}` },
    { id: '3', type: 'bet' as const, user: '0x9876543210fedcba9876543210fedcba98765432' as `0x${string}`, amount: BigInt(10e18), isYes: false, timestamp: Math.floor(Date.now()/1000) - 450, txHash: '0xghi789' as `0x${string}` },
  ];

  const displayActivities = activities.length > 0 ? activities : sampleActivities;

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">LIVE ACTIVITY</h2>
          <LiveIndicator />
        </div>

        <Card className="glass overflow-hidden">
          <div className="divide-y divide-border">
            {displayActivities.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No activity yet"
                description="Be the first to make a prediction!"
              />
            ) : (
              displayActivities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  type={activity.type}
                  user={activity.user}
                  amount={activity.amount}
                  isYes={activity.isYes}
                  timestamp={activity.timestamp}
                  txHash={activity.txHash}
                  compact
                />
              ))
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}

// ===========================================
// SECTION 5: Top Predictors
// ===========================================
function TopPredictorsSection() {
  // Mock data - in production, fetch from contract or API
  const topPredictors = [
    { rank: 1, address: '0x1234...5678' as const, points: 15420, wins: 89, winRate: 78 },
    { rank: 2, address: '0xabcd...efgh' as const, points: 12350, wins: 72, winRate: 71 },
    { rank: 3, address: '0x9876...4321' as const, points: 9870, wins: 65, winRate: 68 },
  ];

  const podiumOrder = [1, 0, 2]; // Display 2nd, 1st, 3rd

  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">TOP PREDICTORS</h2>
          <p className="text-muted-foreground">The most accurate forecasters on iPredict</p>
        </div>

        {/* Podium Display */}
        <div className="flex items-end justify-center gap-4 mb-8">
          {podiumOrder.map((index) => {
            const predictor = topPredictors[index];
            const isFirst = predictor.rank === 1;
            
            return (
              <div 
                key={predictor.rank}
                className={cn(
                  'flex flex-col items-center',
                  isFirst ? 'order-2' : predictor.rank === 2 ? 'order-1' : 'order-3'
                )}
              >
                <div className={cn(
                  'w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-3',
                  isFirst 
                    ? 'bg-gold/20 ring-4 ring-gold/50' 
                    : predictor.rank === 2 
                      ? 'bg-gray-400/20 ring-2 ring-gray-400/50'
                      : 'bg-amber-700/20 ring-2 ring-amber-700/50'
                )}>
                  <Trophy className={cn(
                    'h-8 w-8 md:h-10 md:w-10',
                    isFirst ? 'text-gold' : predictor.rank === 2 ? 'text-gray-400' : 'text-amber-700'
                  )} />
                </div>
                
                <Card className={cn(
                  'glass text-center w-28 md:w-36',
                  isFirst ? 'glow-primary' : ''
                )}>
                  <CardContent className="pt-4 pb-3">
                    <div className={cn(
                      'text-2xl md:text-3xl font-bold mb-1',
                      isFirst ? 'text-gold' : ''
                    )}>
                      #{predictor.rank}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground mb-2">
                      {predictor.address}
                    </div>
                    <div className="text-lg font-bold gradient-injective-text">
                      {predictor.points.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </CardContent>
                </Card>

                {/* Podium Base */}
                <div className={cn(
                  'w-full rounded-t-lg mt-2',
                  isFirst 
                    ? 'h-20 bg-gradient-to-t from-gold/30 to-gold/10' 
                    : predictor.rank === 2 
                      ? 'h-14 bg-gradient-to-t from-gray-400/30 to-gray-400/10'
                      : 'h-10 bg-gradient-to-t from-amber-700/30 to-amber-700/10'
                )} />
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link href="/leaderboard">
            <Button variant="outline" className="gap-2">
              View Full Leaderboard
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ===========================================
// SECTION 6: Why iPredict
// ===========================================
function WhyiPredictSection() {
  const features = [
    {
      icon: Zap,
      title: 'Instant Finality',
      description: 'Transactions confirm in seconds on Injective EVM.',
    },
    {
      icon: DollarSign,
      title: 'Near-Zero Fees',
      description: 'Minimal gas costs mean more of your stake goes to the pool.',
    },
    {
      icon: Eye,
      title: 'Fully Transparent',
      description: 'All market data and odds are on-chain and verifiable.',
    },
    {
      icon: Gamepad2,
      title: 'Gamified',
      description: 'Earn points for correct predictions and climb the leaderboard.',
    },
    {
      icon: Lock,
      title: 'Secure',
      description: 'Non-custodial smart contracts. Your funds, your control.',
    },
    {
      icon: Globe,
      title: 'Global Access',
      description: 'Predict from anywhere, anytime. No geographic restrictions.',
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">WHY iPREDICT</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built on Injective for the best prediction market experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature) => (
            <Card key={feature.title} className="glass hover:glow-primary transition-all duration-300">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" className="gap-2" asChild>
            <a 
              href={`https://testnet.blockscout.injective.network/address/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              View Smart Contract
            </a>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <a 
              href="https://github.com/iPredict"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ===========================================
// SECTION 7: Roadmap
// ===========================================
function RoadmapSection() {
  const roadmap = [
    {
      quarter: 'Q1 2026',
      title: 'Foundation',
      items: [
        { text: 'Smart Contract Development', completed: true },
        { text: 'Testnet Deployment', completed: true },
        { text: 'Core Frontend Launch', completed: true },
        { text: 'Wallet Integration', completed: true },
      ],
    },
    {
      quarter: 'Q2 2026',
      title: 'Growth',
      items: [
        { text: 'Mainnet Launch', completed: false },
        { text: 'Mobile-Optimized UI', completed: false },
        { text: 'Advanced Analytics', completed: false },
        { text: 'API for Developers', completed: false },
      ],
    },
    {
      quarter: 'Q3 2026',
      title: 'Expansion',
      items: [
        { text: 'Governance Token', completed: false },
        { text: 'Community Market Creation', completed: false },
        { text: 'Cross-Chain Integration', completed: false },
        { text: 'Mobile App', completed: false },
      ],
    },
    {
      quarter: 'Q4 2026+',
      title: 'Evolution',
      items: [
        { text: 'DAO Governance', completed: false },
        { text: 'Advanced Market Types', completed: false },
        { text: 'Institutional Features', completed: false },
        { text: 'Global Expansion', completed: false },
      ],
    },
  ];

  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">ROADMAP</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our journey to becoming the leading prediction market on Injective
          </p>
        </div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20" />

          <div className="space-y-8 md:space-y-0">
            {roadmap.map((phase, index) => (
              <div 
                key={phase.quarter}
                className={cn(
                  'md:flex md:items-start',
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                )}
              >
                {/* Content */}
                <div className={cn(
                  'md:w-1/2 mb-8 md:mb-16',
                  index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'
                )}>
                  <Card className="glass inline-block">
                    <CardContent className="pt-6">
                      <Badge className="gradient-injective text-primary-foreground mb-3">
                        {phase.quarter}
                      </Badge>
                      <h3 className="text-xl font-semibold mb-4">{phase.title}</h3>
                      <ul className={cn(
                        'space-y-2',
                        index % 2 === 0 ? 'md:text-right' : 'text-left'
                      )}>
                        {phase.items.map((item) => (
                          <li 
                            key={item.text}
                            className={cn(
                              'flex items-center gap-2 text-sm',
                              index % 2 === 0 ? 'md:flex-row-reverse' : ''
                            )}
                          >
                            {item.completed ? (
                              <Check className="h-4 w-4 text-yes flex-shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className={item.completed ? 'text-foreground' : 'text-muted-foreground'}>
                              {item.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Timeline Dot */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary ring-4 ring-background" 
                  style={{ top: `${index * 25 + 5}%` }}
                />

                {/* Empty space for alternating layout */}
                <div className="hidden md:block md:w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ===========================================
// SECTION 8: Community
// ===========================================
function CommunitySection() {
  const socials = [
    {
      name: 'Twitter',
      icon: () => (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      href: 'https://twitter.com/iPredict',
      members: '12.5K',
      color: 'hover:bg-sky-500/20 hover:border-sky-500/50',
    },
    {
      name: 'Discord',
      icon: () => (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      ),
      href: 'https://discord.gg/iPredict',
      members: '8.2K',
      color: 'hover:bg-indigo-500/20 hover:border-indigo-500/50',
    },
    {
      name: 'Telegram',
      icon: () => (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
      href: 'https://t.me/iPredict',
      members: '5.8K',
      color: 'hover:bg-sky-400/20 hover:border-sky-400/50',
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">JOIN THE COMMUNITY</h2>
        <p className="text-muted-foreground mb-12 max-w-xl mx-auto">
          Connect with other predictors, get updates, and shape the future of iPredict
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {socials.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className={cn(
                'glass transition-all duration-300 hover:-translate-y-1',
                social.color
              )}>
                <CardContent className="pt-8 pb-6">
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                    <social.icon />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{social.name}</h3>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mb-4">
                    <Users className="h-4 w-4" />
                    {social.members} members
                  </div>
                  <Button variant="secondary" size="sm" className="gap-2">
                    Join Now
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===========================================
// SECTION 9: Footer
// ===========================================
function Footer() {
  const footerLinks = {
    Product: [
      { label: 'Markets', href: '/markets' },
      { label: 'Leaderboard', href: '/leaderboard' },
      { label: 'Profile', href: '/profile' },
      { label: 'How It Works', href: '#how-it-works' },
    ],
    Resources: [
      { label: 'Documentation', href: '#' },
      { label: 'API', href: '#' },
      { label: 'Smart Contract', href: '#' },
      { label: 'GitHub', href: 'https://github.com/iPredict' },
    ],
    Community: [
      { label: 'Twitter', href: 'https://twitter.com/iPredict' },
      { label: 'Discord', href: 'https://discord.gg/iPredict' },
      { label: 'Telegram', href: 'https://t.me/iPredict' },
      { label: 'Blog', href: '#' },
    ],
    Legal: [
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Disclaimer', href: '#' },
      { label: 'Cookie Policy', href: '#' },
    ],
  };

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-injective flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl">iPredict</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Decentralized prediction markets powered by Injective
            </p>
            <Badge variant="outline" className="gap-1.5">
              <Zap className="h-3 w-3" />
              Built on Injective
            </Badge>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 iPredict. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com/iPredict"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://discord.gg/iPredict"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
            <a
              href="https://github.com/iPredict"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ===========================================
// MAIN PAGE COMPONENT
// ===========================================
export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturedMarketsSection />
      <HowItWorksSection />
      <LiveActivitySection />
      <TopPredictorsSection />
      <WhyiPredictSection />
      <RoadmapSection />
      <CommunitySection />
      <Footer />
    </main>
  );
}
